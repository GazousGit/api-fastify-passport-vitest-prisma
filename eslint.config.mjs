import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import security from 'eslint-plugin-security'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.d.ts'],
  },
  ...tseslint.configs.recommended,
  security.configs.recommended,
  prettier,
]
