import { describe, it, expect } from 'vitest'
import { isStrongPassword } from './isStrongPassword.js'

describe('modules -> auth -> helpers -> isStrongPassword', () => {
  describe('should return true', () => {
    it.each([
      'Password1!',
      'Str0ng#Pass',
      'C0mpl3x!Password',
      'MyP@ssw0rd',
      'Abcdef1$',
    ])('accepts %s', (password) => {
      expect(isStrongPassword(password)).toBe(true)
    })
  })

  describe('should return false', () => {
    it.each([
      ['password', 'no uppercase, no digit, no symbol'],
      ['PASSWORD1!', 'no lowercase'],
      ['Password!', 'no digit'],
      ['Password1', 'no symbol'],
      ['Pa1!', 'too short'],
      ['', 'empty string'],
    ])('rejects %s (%s)', (password) => {
      expect(isStrongPassword(password)).toBe(false)
    })
  })
})
