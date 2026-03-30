import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify'

// In Fastify v5, reply.sent = raw.writableEnded (set only after res.end()).
// wrapThenable fires before the onSend pipeline finishes, sees reply.sent=false,
// and calls reply.send() a second time → two pipelines → ERR_HTTP_HEADERS_SENT.
// reply.hijack() sets kReplyHijacked, which wrapThenable checks first and exits.
export function oauthHandler(handler: unknown): RouteHandlerMethod {
  const fn = handler as (req: FastifyRequest, rep: FastifyReply) => Promise<unknown>
  return (async function (request: FastifyRequest, reply: FastifyReply) {
    await fn(request, reply)
    reply.hijack()
  }) as unknown as RouteHandlerMethod
}
