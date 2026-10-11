import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/api';
import { HttpClient } from './http-client';

export { HttpClient, type GetOptions, type PostOptions, type QueryParameters } from './http-client';
export { HttpError, isAbortedRequest, type HttpErrorKind } from './http-error';
export { getMutationOutcome, type MutationOutcome } from './mutation-outcome';

/** One shared instance — the analogue of providedIn: 'root' */
export const httpClient = new HttpClient({ baseUrl: API_BASE_URL, timeoutMs: API_TIMEOUT_MS });
