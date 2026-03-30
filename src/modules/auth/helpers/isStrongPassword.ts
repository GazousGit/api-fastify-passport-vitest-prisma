import { PASSWORD_REGEX } from '../../../core/constant.js'

export function isStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password)
}
