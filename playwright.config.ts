import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 1366, height: 768 },
    // WebGL logiciel pour les machines sans GPU (CI, conteneurs)
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: { command: 'npx vite --port 5174 --strictPort --bypass-lock', port: 5174, reuseExistingServer: true },
});
