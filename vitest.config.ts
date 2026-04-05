import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.{unit,spec,integration}.ts'],
    fileParallelism: false,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{unit,spec,integration}.ts'],
    },
  },
})
