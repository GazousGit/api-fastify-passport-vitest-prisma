import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.{unit,spec}.ts'],
    globalSetup: ['./test/globalSetup.ts'],
    setupFiles: ['./test/setup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{unit,spec}.ts'],
    },
  },
})
