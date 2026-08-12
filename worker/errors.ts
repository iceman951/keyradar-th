import type { ApiErrorCode } from '../shared/contracts/api-dto.ts';

/**
 * Thrown by services for every expected failure mode. `worker/middleware/
 * error-handler.ts` is the single place that turns these into an
 * `ApiErrorDto` response with the matching HTTP status — route and service
 * code never builds a `Response` directly.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ApiErrorCode, status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const gameNotFound = (slug: string): ApiError =>
  new ApiError('GAME_NOT_FOUND', 404, `Game "${slug}" was not found.`, { slug });

export const editionNotFound = (slug: string, editionKey: string): ApiError =>
  new ApiError(
    'EDITION_NOT_FOUND',
    404,
    `Edition "${editionKey}" was not found for game "${slug}".`,
    { slug, editionKey }
  );

/**
 * Wraps an unexpected D1/Drizzle failure. The original error is never
 * forwarded to the client (it may contain SQL or binding details) — only
 * logged server-side by the caller before this is thrown.
 */
export const databaseError = (): ApiError =>
  new ApiError('DATABASE_ERROR', 500, 'A database error occurred while handling the request.');
