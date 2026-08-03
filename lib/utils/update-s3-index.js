import * as core from '@actions/core'
import { setTimeout } from 'node:timers/promises'

import { getS3Client } from './get-s3-client.js'

/**
 * @typedef GitAuthor
 * @property {string} date
 */

/**
 * @typedef GitCommitInfo
 * @property {GitAuthor} author
 * @property {string} sha
 * @property {string} message
 */

/**
 * @typedef UpdateS3IndexOptions
 * @property {Inputs} inputs
 * @property {string[]} files
 * @property {GitCommitInfo} commit
 * @property {number} [tryCount]
 */

/**
 * @param {UpdateS3IndexOptions} options
 * @returns {Promise<void>}
 */
export default async function updateS3Index({
  inputs,
  files,
  commit,
  tryCount = 1,
}) {
  core.info('Update index file')
  const indexFileKey = getIndexFileKey(inputs)
  const s3Client = getS3Client(inputs)
  const listResponse = await s3Client.listObjectsV2({
    Bucket: inputs.s3Bucket,
    Prefix: indexFileKey,
  })

  if (listResponse.KeyCount > 1) {
    throw new Error('More than one index file')
  }

  let content = []
  // eslint-disable-next-line unicorn/prevent-abbreviations
  let eTag

  if (listResponse.KeyCount === 1) {
    const objectResponse = await s3Client.getObject({
      Bucket: inputs.s3Bucket,
      Key: indexFileKey,
    })

    eTag = objectResponse.ETag
    content = JSON.parse(await objectResponse.Body.transformToString())
  }

  let jsonCommit = content.find((item) => item.sha === commit.sha)
  if (!jsonCommit) {
    jsonCommit = {
      sha: commit.sha,
      message: commit.message,
      date: commit.author.date,
      files: [],
    }
    content.push(jsonCommit)
  }

  let addedFile = false
  for (const file of files) {
    const isContains = jsonCommit.files.includes(file)
    if (isContains) {
      continue
    }

    addedFile = true
    jsonCommit.files.push(file)
  }

  if (!addedFile) {
    return
  }

  /**
   * Backblaze B2 rejects If-Match / If-None-Match on PutObject (501 NotImplemented).
   * Keep conditional writes on AWS; for custom endpoints, put then verify/retry.
   */
  const putParams = {
    Bucket: inputs.s3Bucket,
    Body: JSON.stringify(content),
    Key: indexFileKey,
  }

  if (!inputs.s3Endpoint) {
    if (eTag) {
      putParams.IfMatch = eTag
    } else {
      putParams.IfNoneMatch = '*'
    }
  }

  try {
    await s3Client.putObject(putParams)
  } catch (error) {
    core.error('Cannot update index file')
    core.error(error.message)

    if (tryCount > 3) {
      throw error
    }

    if (
      error.Code === 'PreconditionFailed' ||
      error.Code === 'OperationAborted'
    ) {
      console.info('Wait 5 second before retry update index file')
      await setTimeout(5000)

      return updateS3Index({
        inputs,
        files,
        commit,
        tryCount: tryCount + 1,
      })
    }

    throw error
  }

  if (!inputs.s3Endpoint) {
    return
  }

  const verifyResponse = await s3Client.getObject({
    Bucket: inputs.s3Bucket,
    Key: indexFileKey,
  })
  const verified = JSON.parse(await verifyResponse.Body.transformToString())
  const verifiedCommit = verified.find((item) => item.sha === commit.sha)
  const missingFile = files.some(
    (file) => !verifiedCommit?.files.includes(file),
  )

  if (!missingFile) {
    return
  }

  if (tryCount > 3) {
    throw new Error('Cannot update index file after concurrent writes')
  }

  core.info('Index missing files after put; retrying merge')
  await setTimeout(1000 * tryCount)

  return updateS3Index({
    inputs,
    files,
    commit,
    tryCount: tryCount + 1,
  })
}

export function getIndexFileKey(inputs) {
  if (inputs.s3IndexFileKey) {
    return inputs.s3IndexFileKey
  }

  return inputs.s3KeyPrefix + 'index.json'
}
