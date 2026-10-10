import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// Reuses the Vite config (aliases @app/@shared/…, SCSS load paths, import.meta.glob) so tests resolve modules
// exactly like the app does.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Specs live next to the code they test, Angular-style: format.ts → format.spec.ts
      include: ['src/**/*.spec.ts'],
      // Pure logic runs in plain Node (fast). A spec that needs the DOM (DOMParser, events, History API, components)
      // opts in with a `// @vitest-environment happy-dom` comment on its first line.
      environment: 'node',
      // Every test starts clean: vi.fn()/vi.spyOn mocks, stubbed globals (fetch) and env are restored automatically
      restoreMocks: true,
      unstubGlobals: true,
      unstubEnvs: true,
      coverage: {
        provider: 'v8',
        // maxCols: full file paths in the terminal table instead of "...onent.base.ts"
        reporter: [['text', { maxCols: 120 }], 'html'],
        // Every source file is listed, including the ones no test imports yet (they show up as 0%)
        include: ['src/**/*.ts'],
        exclude: [
          // Pure bootstrap: global style/font imports and a single bootstrapApp() call, no logic of its own
          'src/main.ts',
          // The tests themselves
          'src/**/*.spec.ts',
          // Test-only helpers (fake responses, fixtures): never shipped to users
          'src/testing/**',
          // Interfaces and type aliases only: erased at compile time, there is no runtime code to cover
          'src/app/shared/types/**',
        ],
      },
    },
  }),
);
