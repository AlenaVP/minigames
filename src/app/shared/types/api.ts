/** Single entity: { data: {...} } */
export interface ApiResponse<T> {
  data: T;
}

/** Every collection: { data: [...], meta: {...} } */
export interface ApiListResponse<T, M> {
  data: T[];
  meta: M;
}

/** GET /api/games meta (appliedFilter is not used by the UI, so it's left out) */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/** GET /api/games/{slug}/comments meta */
export interface CommentsMeta {
  totalComments: number;
  returnedCount: number;
}
