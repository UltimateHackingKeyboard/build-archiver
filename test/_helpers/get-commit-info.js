import { TEST_GITHUB_SHA } from '../../lib/constants.js'

/**
 * @returns {GitCommitInfo}
 */
export default function getCommitInfo() {
  return {
    sha: TEST_GITHUB_SHA,
    message: 'commit message',
    author: {
      date: '2020-05-01T12:000.000Z',
      email: 'email@example.com',
      name: 'Author',
    },
  }
}
