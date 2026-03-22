export interface ErrorResponse {
  statusCode: number
  error: string
  message: string
}

export function toErrorResponse(
  statusCode: number,
  error: string,
  message: string,
): ErrorResponse {
  return { statusCode, error, message }
}

export const HttpError = {
  badRequest: (message = 'Bad Request') => toErrorResponse(400, 'Bad Request', message),
  unauthorized: (message = 'Unauthorized') => toErrorResponse(401, 'Unauthorized', message),
  forbidden: (message = 'Forbidden') => toErrorResponse(403, 'Forbidden', message),
  notFound: (message = 'Not Found') => toErrorResponse(404, 'Not Found', message),
  conflict: (message = 'Conflict') => toErrorResponse(409, 'Conflict', message),
  unprocessable: (message = 'Unprocessable Entity') =>
    toErrorResponse(422, 'Unprocessable Entity', message),
  tooManyRequests: (message = 'Too Many Requests') =>
    toErrorResponse(429, 'Too Many Requests', message),
  internal: (message = 'Internal Server Error') =>
    toErrorResponse(500, 'Internal Server Error', message),
} as const
