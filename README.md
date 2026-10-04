# 🧩 MiniGames

A bootcamp SPA project (RS School) implementing a game catalog based on a Figma design: Home and Library pages, plus authentication and game-details dialogs.

**Deployment:** <https://minigames-avp.netlify.app/>

## Tech Stack

- TypeScript
- Vite
- Sass (SCSS)
- ESLint + Prettier
- Husky + lint-staged
- Vanilla DOM (no frameworks)

## Figma

[MiniGames Design](https://www.figma.com/design/4MnLizE59gZI2DDxaSgZqi/MiniGames?node-id=0-1&m=dev&t=fsxihMHW5MYSxEkW-1)

## Getting Started

```bash
npm install
npm run dev
```

## Backend API

Public read endpoints of the course backend (base URL in `src/app/core/constants/api.ts`):

| Endpoint                                    | Used by                                       |
| ------------------------------------------- | --------------------------------------------- |
| `GET /api/games?featured=true`              | Home — "New Games" slider                     |
| `GET /api/leaderboard`                      | Home — "Top Players This Week"                |
| `GET /api/categories`                       | Library — category chips (cached per session) |
| `GET /api/games?category&sort&page&limit=6` | Library — cards and pagination                |
| `GET /api/games/{slug}`                     | Game Details dialog                           |
| `GET /api/games/{slug}/comments?limit=3`    | Game Details dialog — latest comments         |

Filtering, sorting and pagination are done by the server. Every API-driven area has a skeleton, an error banner with
Retry, an empty state and Snackbar notifications.

## Routes and URL

A custom History API router (no libraries). The URL is the single source of truth: user actions change the URL, and
the URL restores the page, the Library controls and the dialogs (deep links, Back / Forward).

| URL                                             | State                                     |
| ----------------------------------------------- | ----------------------------------------- |
| `/`, `/home`                                    | Home                                      |
| `/library?category=puzzle&sort=name-asc&page=2` | Library with filter, sort and page        |
| `…?game=tukoni-forest-keepers`                  | Game Details dialog over the current page |
| `…?auth=login`, `…?auth=register`               | Auth dialog over the current page         |
| any other path                                  | 404 page                                  |

Invalid parameters are corrected (with a warning) and the URL is replaced with its canonical form. On Netlify,
`public/_redirects` serves the SPA for every path.

## Scripts

| Script                 | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | starts the development server             |
| `npm run build`        | builds the production bundle              |
| `npm run preview`      | previews the production build locally     |
| `npm run lint`         | runs ESLint checks                        |
| `npm run format`       | formats the code with Prettier            |
| `npm run format:check` | checks formatting without modifying files |

## Project Structure

```
src/
├── app/
│   ├── core/            # app bootstrap, base classes, router, http client, constants
│   ├── pages/           # routed features (home, library, not-found)
│   ├── widgets/         # shared composite UI blocks (header, footer, burger-menu, game-card)
│   ├── dialogs/         # modal windows (auth, game details)
│   ├── shared/          # reusable atoms, utils, shared types
│   └── services/        # API services (games, catalog)
├── assets/              # icons, images, fonts
├── styles/              # global Sass (design tokens, breakpoints, base styles)
└── main.ts
```
