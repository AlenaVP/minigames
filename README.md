# 🧩 MiniGames

A bootcamp SPA project (RS School) implementing a game catalog based on a Figma design: Home and Library pages, plus authentication and game-details dialogs.

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

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | starts the development server |
| `npm run build` | builds the production bundle |
| `npm run preview` | previews the production build locally |
| `npm run lint` | runs ESLint checks |
| `npm run format` | formats the code with Prettier |
| `npm run format:check` | checks formatting without modifying files |

## Project Structure

```
src/
├── app/
│   ├── core/            # app bootstrap, base component class, constants
│   ├── pages/           # routed features (home, library)
│   ├── widgets/         # shared composite UI blocks (header, footer, burger-menu, game-card)
│   ├── dialogs/         # modal windows (auth, game details)
│   ├── shared/          # reusable atoms, utils, shared types
│   └── services/        # future API/auth services
├── assets/              # icons, images, fonts
├── styles/              # global Sass (design tokens, breakpoints, base styles)
└── main.ts
```
