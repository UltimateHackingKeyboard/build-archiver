import { describe, it } from 'node:test'

import {
  getReferenceInfo,
  isSameReference,
} from '../../lib/utils/get-reference-info.js'

describe('getReferenceInfo', () => {
  it('should return the branch of a push', ({ assert }) => {
    const reference = getReferenceInfo({
      ref: 'refs/heads/master',
      payload: {},
    })

    assert.deepStrictEqual(reference, { type: 'branch', name: 'master' })
  })

  it('should keep slashes in the branch name', ({ assert }) => {
    const reference = getReferenceInfo({
      ref: 'refs/heads/feat/foo',
      payload: {},
    })

    assert.deepStrictEqual(reference, { type: 'branch', name: 'feat/foo' })
  })

  it('should return the tag of a tag push or release', ({ assert }) => {
    const reference = getReferenceInfo({ ref: 'refs/tags/v1.2.3', payload: {} })

    assert.deepStrictEqual(reference, { type: 'tag', name: 'v1.2.3' })
  })

  it('should return the head branch and number of a PR', ({ assert }) => {
    const reference = getReferenceInfo({
      ref: 'refs/pull/12/merge',
      payload: { pull_request: { number: 12, head: { ref: 'feature' } } },
    })

    assert.deepStrictEqual(reference, {
      type: 'pr',
      name: 'feature',
      number: 12,
    })
  })

  it('should return undefined for an unknown ref', ({ assert }) => {
    assert.strictEqual(getReferenceInfo({ ref: '', payload: {} }), undefined)
  })
})

describe('isSameReference', () => {
  it('should compare type, name and number', ({ assert }) => {
    const branch = { type: 'branch', name: 'master' }

    assert.ok(isSameReference(branch, { type: 'branch', name: 'master' }))
    assert.ok(!isSameReference(branch, { type: 'tag', name: 'master' }))
    assert.ok(
      !isSameReference(
        { type: 'pr', name: 'a', number: 1 },
        { type: 'pr', name: 'a', number: 2 },
      ),
    )
  })
})
