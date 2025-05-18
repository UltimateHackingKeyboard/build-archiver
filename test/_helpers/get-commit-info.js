import process from 'node:process'

/**
 * @returns {GitCommitInfo}
 */
export default function getCommitInfo() {
  return {
    sha: process.env.GITHUB_SHA,
    message: 'commit message',
    author: {
      date: '2020-05-01T12:000.000Z',
      email: 'email@example.com',
      name: 'Author',
    },
  }
}
