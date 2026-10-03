import { httpClient } from '@app/core/http';
import { CatalogApi } from './catalog.api';
import { GamesApi } from './games.api';

export { CatalogApi } from './catalog.api';
export { GamesApi } from './games.api';

/** App-wide singletons — the analogue of @Injectable({ providedIn: 'root' }) */
export const gamesApi = new GamesApi(httpClient);
export const catalogApi = new CatalogApi(httpClient);
