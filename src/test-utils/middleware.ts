import { vi } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'

export function makeReply(): FastifyReply {
  const reply = { code: vi.fn(), send: vi.fn() } as unknown as FastifyReply
  vi.mocked(reply.code).mockReturnValue(reply)
  return reply
}

export function makeRequest({ body, params }: { body?: unknown; params?: unknown }): FastifyRequest {
  return { body, params } as FastifyRequest
}
