import core from '@actions/core'
import * as process from 'node:process'

/**
 * @typedef Inputs
 * @property {string} filePattern
 * @property {string} ghToken
 * @property {string} s3AccessKey
 * @property {string} s3AccessKeyId
 * @property {string} s3Bucket
 * @property {string} s3IndexFileKey
 * @property {string} s3KeyPrefix
 * @property {string} s3Region
 */

/**
 * @returns {Inputs}
 */
export function getInputs() {
  if (process.env.IS_LOCAL_DEV === 'true') {
    // override the settings here,
    // because GitHub CI already set them and node does not overwrite them
    process.env.GITHUB_REPOSITORY = 'me/my-repo'
    process.env.GITHUB_SHA = 'b52b1244'

    return {
      filePattern: process.env.FILE_PATTERN,
      ghToken: process.env.GH_TOKEN,
      s3AccessKey: process.env.S3_ACCESS_KEY,
      s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
      s3Bucket: process.env.S3_BUCKET,
      s3IndexFileKey: process.env.S3_INDEX_FILE_KEY,
      s3KeyPrefix: process.env.S3_KEY_PREFIX,
      s3Region: process.env.S3_REGION,
    }
  }

  return {
    filePattern: core.getInput('FILE_PATTERN', { required: true }),
    ghToken: core.getInput('GH_TOKEN', { required: true }),
    s3AccessKey: core.getInput('S3_ACCESS_KEY', { required: true }),
    s3AccessKeyId: core.getInput('S3_ACCESS_KEY_ID', { required: true }),
    s3Bucket: core.getInput('S3_BUCKET', { required: true }),
    s3IndexFileKey: core.getInput('S3_INDEX_FILE_KEY', { required: true }),
    s3KeyPrefix: core.getInput('S3_KEY_PREFIX', { required: true }),
    s3Region: core.getInput('S3_REGION', { required: true }),
  }
}
