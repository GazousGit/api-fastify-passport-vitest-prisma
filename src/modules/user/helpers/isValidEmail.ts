import { EMAIL_REGEX } from '../../../core/constant.js'

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}
