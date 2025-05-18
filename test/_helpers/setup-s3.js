import process from 'node:process'

import { getInputs } from '../../lib/utils/get-inputs.js'
import { getS3Client } from '../../lib/utils/get-s3-client.js'

export default async function setupS3() {
  const inputs = getInputs()
  const s3 = getS3Client(inputs)
  const buckets = await s3.listBuckets({})
  const isBucketExists = buckets.Buckets.some(
    (bucket) => bucket.Name === inputs.s3Bucket,
  )

  if (!isBucketExists) {
    await s3.createBucket({
      Bucket: inputs.s3Bucket,
    })
  }

  await clearBucket(inputs.s3Bucket, s3)
}

async function clearBucket(bucket, s3) {
  const s3Objects = await s3.listObjectsV2({
    Bucket: bucket,
  })

  if (s3Objects.Contents)
    for (const s3Object of s3Objects.Contents) {
      await s3.deleteObject({
        Bucket: bucket,
        Key: s3Object.Key,
      })
    }
}
