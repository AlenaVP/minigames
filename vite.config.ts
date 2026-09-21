import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/minigames/',
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('src/app', import.meta.url)),
      '@widgets': fileURLToPath(new URL('src/app/widgets', import.meta.url)),
      '@shared': fileURLToPath(new URL('src/app/shared', import.meta.url)),
      '@dialogs': fileURLToPath(new URL('src/app/dialogs', import.meta.url)),
      '@styles': fileURLToPath(new URL('src/styles', import.meta.url)),
      '@assets': fileURLToPath(new URL('src/assets', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: ['src/styles'],
      },
    },
  },
  build: { outDir: 'dist' },
  server: { open: true },
});
