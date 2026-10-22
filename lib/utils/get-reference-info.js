/**
 * @typedef RefInfo
 * @property {'branch' | 'tag' | 'pr'} type
 * @property {string} name
 * @property {number} [number]
 * @property {string[]} [files] Files uploaded by this ref's runs; set when stored in the index.
 */

/**
 * Describe the git ref that triggered the workflow run.
 *
 * @param {import('@actions/github').context} context
 * @returns {RefInfo | undefined}
 */
export function getReferenceInfo(context) {
  const pullRequest = context?.payload?.pull_request
  if (pullRequest) {
    return {
      type: 'pr',
      name: pullRequest.head.ref,
      number: pullRequest.number,
    }
  }

  const qualifiedName = context?.ref ?? ''
  if (qualifiedName.startsWith('refs/tags/')) {
    return { type: 'tag', name: qualifiedName.slice('refs/tags/'.length) }
  }

  if (qualifiedName.startsWith('refs/heads/')) {
    return { type: 'branch', name: qualifiedName.slice('refs/heads/'.length) }
  }
}

/**
 * @param {RefInfo} a
 * @param {RefInfo} b
 * @returns {boolean}
 */
export function isSameReference(a, b) {
  return a.type === b.type && a.name === b.name && a.number === b.number
}
