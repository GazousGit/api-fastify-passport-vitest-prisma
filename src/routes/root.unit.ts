import { test, expect } from 'vitest'
import { build } from '../../test/helper.js'

test('should return health status', async () => {
  const app = await build()

  const res = await app.inject({ url: '/health' })
  expect(JSON.parse(res.payload)).toEqual({ status: 'ok' })
})
