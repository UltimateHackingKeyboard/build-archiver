import { getInputs } from '../../lib/utils/get-inputs.js'
import { getS3Client } from '../../lib/utils/get-s3-client.js'

export default async function getS3Objects() {
  const inputs = getInputs()
  const s3 = getS3Client(inputs)
  const objects = await s3.listObjectsV2({
    Bucket: inputs.s3Bucket,
  })

  const result = []

  for (const object of objects.Contents) {
    const d = await s3.getObject({ Bucket: inputs.s3Bucket, Key: object.Key })

    const o = {
      key: object.Key,
      data: await d.Body.transformToString(),
    }

    result.push(o)
  }

  return result.sort(function (a, b) {
    return a.key.localeCompare(b.key)
  })
}
