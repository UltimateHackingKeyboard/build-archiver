import core from '@actions/core'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'node:fs'
import { getS3Client } from './get-s3-client.js'

/**
 * @param {Inputs} inputs
 * @param {string} key
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export default async function uploadToS3(inputs, key, filePath) {
  core.info(`Upload file: ${filePath} as ${key}`)

  const s3Client = getS3Client(inputs)

  await new Upload({
    client: s3Client,
    params: {
      Body: fs.createReadStream(filePath),
      Bucket: inputs.s3Bucket,
      Key: key,
    },
  }).done()
}
