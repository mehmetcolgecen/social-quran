// UI duman testleri — her kod çıkışında koşan standart (CI: ci.yml 'ui' işi).
// Prod build'e karşı koşar; quran.db gerekir (CI'da pipeline cache'le kurulur).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3199',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx next start -p 3199',
    url: 'http://localhost:3199',
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
