import { S3 } from '@aws-sdk/client-s3'

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

  if (inputs.s3Endpoint) {
    options.endpoint = inputs.s3Endpoint
    options.forcePathStyle = true
  }

  return new S3(options)
}
