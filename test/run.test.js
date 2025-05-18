import nock from 'nock'
import { after, before, beforeEach, describe, it } from 'node:test'
import { TEST_GITHUB_SHA } from '../lib/constants.js'

import { run } from '../lib/run.js'
import getCommitInfo from './_helpers/get-commit-info.js'
import getS3Objects from './_helpers/get-s3-objects.js'
import setupS3 from './_helpers/setup-s3.js'

describe('run', async () => {
  before(async () => {
    nock.disableNetConnect()
    nock.enableNetConnect('localhost')
  })

  beforeEach(async () => {
    await setupS3()
  })

  after(async () => {
    nock.enableNetConnect()
  })

  await it('should upload files and create index', async ({ assert }) => {
    nock('https://api.github.com')
      .get(`/repos/me/my-repo/git/commits/${TEST_GITHUB_SHA}`)
      .reply(200, getCommitInfo())
    await run()
    const s3Objects = await getS3Objects()

    assert.deepStrictEqual(s3Objects, [
      {
        data: '[{"sha":"b52b1244","message":"commit message","date":"2020-05-01T12:000.000Z","files":["test-01.txt","test-02.txt"]}]',
        key: '/agent/index.json',
      },
      {
        data: '01\n',
        key: '/agent/sha/b52b1244/test-01.txt',
      },
      {
        data: '02\n',
        key: '/agent/sha/b52b1244/test-02.txt',
      },
    ])
  })
})
