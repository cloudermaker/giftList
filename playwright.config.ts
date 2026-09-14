import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Charge la config e2e locale (URL de la base de test, jamais commitée)
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            ...(process.env as Record<string, string>),
            POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ?? '',
            SESSION_SECRET: process.env.SESSION_SECRET ?? 'e2e-test-secret',
            MAINTENANCE_MODE: 'false'
        }
    }
});
