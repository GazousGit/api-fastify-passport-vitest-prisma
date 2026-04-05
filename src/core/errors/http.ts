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

abstract class HttpException extends Error {
  abstract statusCode: number
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class BadRequest extends HttpException {
  statusCode = 400 as const
  constructor(message = 'Bad Request') {
    super(message)
  }
}

export class Unauthorized extends HttpException {
  statusCode = 401 as const
  constructor(message = 'Unauthorized') {
    super(message)
  }
}

export class Forbidden extends HttpException {
  statusCode = 403 as const
  constructor(message = 'Forbidden') {
    super(message)
  }
}

export class NotFound extends HttpException {
  statusCode = 404 as const
  constructor(message = 'Not Found') {
    super(message)
  }
}

export class Conflict extends HttpException {
  statusCode = 409 as const
  constructor(message = 'Conflict') {
    super(message)
  }
}

export class UnprocessableEntity extends HttpException {
  statusCode = 422 as const
  constructor(message = 'Unprocessable Entity') {
    super(message)
  }
}

export class TooManyRequests extends HttpException {
  statusCode = 429 as const
  constructor(message = 'Too Many Requests') {
    super(message)
  }
}

export class InternalServerError extends HttpException {
  statusCode = 500 as const
  constructor(message = 'Internal Server Error') {
    super(message)
  }
}

export class ServiceUnavailable extends HttpException {
  statusCode = 503 as const
  constructor(message = 'Service Unavailable') {
    super(message)
  }
}
