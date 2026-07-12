/** Matches AllExceptionsFilter's actual response body — every non-2xx
 * response from the API has this shape. `message` is a single string for
 * most errors, or a string array specifically for class-validator
 * ValidationPipe failures. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
