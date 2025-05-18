import core from '@actions/core'
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
  let ifNonMatch = '*'

  if (listResponse.KeyCount === 1) {
    const objectResponse = await s3Client.getObject({
      Bucket: inputs.s3Bucket,
      Key: indexFileKey,
    })

    eTag = objectResponse.ETag
    content = JSON.parse(await objectResponse.Body.transformToString())
    ifNonMatch = undefined
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

  if (addedFile) {
    try {
      await s3Client.putObject({
        Bucket: inputs.s3Bucket,
        Body: JSON.stringify(content),
        IfMatch: eTag,
        IfNoneMatch: ifNonMatch,
        Key: indexFileKey,
      })
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
  }
}

export function getIndexFileKey(inputs) {
  return inputs.s3KeyPrefix + 'index.json'
}
