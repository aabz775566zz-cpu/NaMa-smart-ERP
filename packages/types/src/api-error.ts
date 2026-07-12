/** Matches AllExceptionsFilter's actual response body — every non-2xx
 * response from the API has this shape. `message` is a single string for
 * most errors, or a string array specifically for class-validator
 * ValidationPipe failures. Kept separate from the pre-existing
 * ApiErrorResponse in api.ts, which does not match this (see notes on that
 * file — it predates the actual error filter and was never reconciled). */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
