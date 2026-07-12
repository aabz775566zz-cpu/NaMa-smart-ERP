import type { ApiErrorBody } from '@erp-smart/types';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly body?: ApiErrorBody;

  constructor(statusCode: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

/** message is a single string for most errors, or a string[] specifically
 * for class-validator ValidationPipe failures — normalize to one string. */
export function extractErrorMessage(body: ApiErrorBody | undefined, fallback: string): string {
  if (!body?.message) return fallback;
  return Array.isArray(body.message) ? body.message.join(' ') : body.message;
}
