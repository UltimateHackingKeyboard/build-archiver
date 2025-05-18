import { beforeEach, describe, it } from 'node:test'

import { getInputs } from '../../lib/utils/get-inputs.js'
import { getS3Client } from '../../lib/utils/get-s3-client.js'
import updateS3Index, {
  getIndexFileKey,
} from '../../lib/utils/update-s3-index.js'
import getCommitInfo from '../_helpers/get-commit-info.js'
import getS3Objects from '../_helpers/get-s3-objects.js'

import setupS3 from '../_helpers/setup-s3.js'

describe('updateS3Index', () => {
  beforeEach(async () => {
    await setupS3()
  })

  it('should create the index file if not exists', async ({ assert }) => {
    await updateS3Index({
      inputs: getInputs(),
      commit: getCommitInfo(),
      files: ['a.txt'],
    })

    const s3Objects = await getS3Objects()

    assert.deepStrictEqual(s3Objects, [
      {
        data: JSON.stringify([
          {
            sha: 'b52b1244',
            message: 'commit message',
            date: '2020-05-01T12:000.000Z',
            files: ['a.txt'],
          },
        ]),
        key: '/agent/index.json',
      },
    ])
  })

  it('should insert a new git commit entry if not exists', async ({
    assert,
  }) => {
    const inputs = getInputs()
    const indexFileKey = getIndexFileKey(inputs)
    const s3Client = getS3Client(inputs)
    await s3Client.putObject({
      Body: JSON.stringify([
        {
          sha: 'a1234b567',
          message: 'commit message 01',
          date: '2020-04-01T12:000.000Z',
          files: ['a.txt'],
        },
      ]),
      Bucket: inputs.s3Bucket,
      Key: indexFileKey,
    })

    await updateS3Index({
      inputs: getInputs(),
      commit: getCommitInfo(),
      files: ['a.txt'],
    })

    const s3Objects = await getS3Objects()

    assert.deepStrictEqual(s3Objects, [
      {
        data: JSON.stringify([
          {
            sha: 'a1234b567',
            message: 'commit message 01',
            date: '2020-04-01T12:000.000Z',
            files: ['a.txt'],
          },
          {
            sha: 'b52b1244',
            message: 'commit message',
            date: '2020-05-01T12:000.000Z',
            files: ['a.txt'],
          },
        ]),
        key: '/agent/index.json',
      },
    ])
  })

  it('should update files if it missing from git commit entry', async ({
    assert,
  }) => {
    const inputs = getInputs()
    const indexFileKey = getIndexFileKey(inputs)
    const s3Client = getS3Client(inputs)
    await s3Client.putObject({
      Body: JSON.stringify([
        {
          sha: 'b52b1244',
          message: 'commit message',
          date: '2020-05-01T12:000.000Z',
          files: ['a.txt'],
        },
      ]),
      Bucket: inputs.s3Bucket,
      Key: indexFileKey,
    })

    await updateS3Index({
      inputs: getInputs(),
      commit: getCommitInfo(),
      files: ['b.txt'],
    })

    const s3Objects = await getS3Objects()

    assert.deepStrictEqual(s3Objects, [
      {
        data: JSON.stringify([
          {
            sha: 'b52b1244',
            message: 'commit message',
            date: '2020-05-01T12:000.000Z',
            files: ['a.txt', 'b.txt'],
          },
        ]),
        key: '/agent/index.json',
      },
    ])
  })
})
