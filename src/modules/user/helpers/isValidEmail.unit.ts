import { describe, it, expect } from 'vitest'
import { isValidEmail } from './isValidEmail.js'

describe('modules -> user -> helpers -> isValidEmail', () => {
  describe('valid addresses', () => {
    it.each([
      'user@example.com',
      'user.name+tag@example.co.uk',
      'user_name@sub.domain.org',
      'user123@example.io',
      'a@b.co',
    ])('accepts %s', (email) => {
      expect(isValidEmail(email)).toBe(true)
    })
  })

  describe('invalid addresses', () => {
    it.each([
      'notanemail',
      '@nodomain.com',
      'user@',
      'user@domain',
      'user @example.com',
      '',
      'user@.com',
      'user@domain.',
    ])('rejects %s', (email) => {
      expect(isValidEmail(email)).toBe(false)
    })
  })
})
