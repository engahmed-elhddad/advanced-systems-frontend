export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(public fields: Record<string, string[]>) {
    super(422, 'validation_error', 'Validation failed', fields)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network error') {
    super(0, 'network_error', message)
    this.name = 'NetworkError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(429, 'rate_limited', message)
    this.name = 'RateLimitError'
  }
}

export class ServerError extends ApiError {
  constructor(message: string, status = 500) {
    super(status, 'server_error', message)
    this.name = 'ServerError'
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export type ApiResult<T> = Promise<T>
