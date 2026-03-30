import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.integration.ts'],
    globalSetup: ['./test/globalSetup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{unit,spec,integration}.ts'],
    },
  },
})
