/** Pagination query parameters */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Paginated list response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
