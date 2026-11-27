import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // MapLibre 6 charge ses workers via new URL(..., import.meta.url) : on évite le pré-bundling qui casserait ces chemins.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
