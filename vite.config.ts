import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Sur GitHub Pages, le site est servi sous /Trends-Radar/ (variable posée par le workflow de déploiement).
  base: process.env.PAGES_BASE ?? '/',
  // MapLibre 6 charge ses workers via new URL(..., import.meta.url) : on évite le pré-bundling qui casserait ces chemins.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  // MapLibre pèse ~1 Mo à lui seul : avertissement relevé en conséquence.
  build: { chunkSizeWarningLimit: 1600 },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
