import { NotFound, ValidationError } from 'elysia'
import type { HTTPHeaders } from 'elysia'
import type { ApiErrorDto } from '../../shared/contracts/api-dto.ts'
import { ApiError } from '../errors'

interface ErrorHandlerContext {
  error: unknown
  set: { status?: number | string; headers: HTTPHeaders }
}

/**
 * The single place an error becomes an HTTP response. Never forwards a raw
 * error message for anything we didn't throw ourselves — unexpected errors
 * are logged server-side (visible via `wrangler tail`) and reported to the
 * client as a generic `INTERNAL_ERROR`, so SQL text, stack traces, and
 * binding names never leak.
 */
export const errorHandler = ({
  error,
  set
}: ErrorHandlerContext): ApiErrorDto => {
  set.headers['content-type'] = 'application/json'
  // Overrides whatever Cache-Control a route set before it threw (routes set
  // their success profile up front, then call the service that may throw —
  // see e.g. worker/routes/games.ts). Errors are never cacheable regardless
  // of which route produced them (spec §13: "Never cache: ... errors").
  set.headers['cache-control'] = 'no-store'

  if (error instanceof ApiError) {
    set.status = error.status
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    }
  }

  // Elysia validates `t` schemas before the handler runs and throws this on
  // failure. Its default status is 422; the spec requires 400.
  if (error instanceof ValidationError) {
    set.status = 400
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request did not pass validation.'
      }
    }
  }

  // No route matched the path at all (e.g. GET /api/v1/unknown).
  if (error instanceof NotFound) {
    set.status = 404
    return {
      error: { code: 'NOT_FOUND', message: 'No route matches this path.' }
    }
  }

  console.error(
    'Unhandled Worker error:',
    error instanceof Error ? error.stack : error
  )
  set.status = 500
  return {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }
  }
}
