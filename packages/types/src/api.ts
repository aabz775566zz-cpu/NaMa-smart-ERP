/** Standard API success response wrapper */
export interface ApiResponse<T> {
  status: 'success';
  data: T;
}

/** Standard API error response wrapper */
export interface ApiErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}
