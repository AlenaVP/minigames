/** Public read-only backend (Story 3). Not a secret, so it lives in the code like Angular's environment.ts. */
export const API_BASE_URL = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api';

/** A request that hangs longer than this becomes a 'timeout' error with a Retry button. */
export const API_TIMEOUT_MS = 10_000;
