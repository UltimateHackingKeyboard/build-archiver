import core from '@actions/core'

import { run } from './lib/run.js'

try {
  await run()
} catch (error) {
  core.setFailed(error)
}
