import core from '@actions/core'
import github from '@actions/github'
import glob from '@actions/glob'
import path from 'node:path'
import process from 'node:process'

import { getInputs } from './utils/get-inputs.js'
import updateS3Index from './utils/update-s3-index.js'
import uploadToS3 from './utils/upload-to-s3.js'

export async function run() {
  const inputs = getInputs()
  let octokitOptions

  if (process.env.IS_LOCAL_DEV) {
    octokitOptions = { request: { fetch } }
  }

  core.info(`github.context.payload: ${JSON.stringify(github.context.payload)}`)
  core.info(
    `github.context.payload.pull_request: ${JSON.stringify(github.context.payload.pull_request)}`,
  )
  const octokit = github.getOctokit(inputs.ghToken, octokitOptions)
  const commitResponse = await octokit.rest.git.getCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commit_sha: process.env.GITHUB_SHA,
  })

  const globber = await glob.create(inputs.filePattern, {
    followSymbolicLinks: false,
  })

  const fileNames = []
  for await (const file of globber.globGenerator()) {
    const fileName = path.basename(file)
    fileNames.push(fileName)
    // eslint-disable-next-line prettier/prettier
    const key = inputs.s3KeyPrefix + 'sha/' + process.env.GITHUB_SHA + '/' + fileName

    await uploadToS3(inputs, key, file)
  }

  await updateS3Index({ inputs, files: fileNames, commit: commitResponse.data })
}
