import { S3 } from '@aws-sdk/client-s3'
import process from 'node:process'

/**
 * @param {Inputs} inputs
 */
export function getS3Client(inputs) {
  /**
   * @type {import('@aws-sdk/client-s3').S3ClientConfig}
   */
  const options = {
    credentials: {
      accessKeyId: inputs.s3AccessKeyId,
      secretAccessKey: inputs.s3AccessKey,
    },
    region: inputs.s3Region,
  }

  if (process.env.S3_ENDPOINT) {
    options.endpoint = process.env.S3_ENDPOINT
    options.forcePathStyle = true
  }

  return new S3(options)
}
