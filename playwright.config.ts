import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Charge la config e2e locale (URL de la base de test, jamais commitée)
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });

export default defineConfig({
    testDir: './e2e',
    timeout: 45_000,
    retries: process.env.CI ? 2 : 0,
    // 1 worker en CI : runner 2 vCPU + base Neon partagée → la parallélisation crée plus de flakiness qu'elle ne fait gagner
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        // Port dédié 3100 : les tests ne réutilisent jamais le dev server manuel (3000)
        baseURL: 'http://localhost:3100',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        { name: 'desktop' },
        // Régression responsive (le footer avait disparu entre 640 et 768px) : smoke sur viewport tablette
        { name: 'tablette', use: { viewport: { width: 700, height: 900 } }, testMatch: /smoke\.spec\.ts/ }
    ],
    webServer: {
        // En CI : build de prod (déterministe) ; en local : dev server (itération rapide)
        command: process.env.CI ? 'npm run build && npm run start -- -p 3100' : 'npm run dev -- -p 3100',
        url: 'http://localhost:3100',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            ...(process.env as Record<string, string>),
            POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ?? '',
            SESSION_SECRET: process.env.SESSION_SECRET ?? 'e2e-test-secret',
            BACKOFFICE_USERNAME: process.env.BACKOFFICE_USERNAME ?? 'e2e-backoffice',
            BACKOFFICE_PASSWORD: process.env.BACKOFFICE_PASSWORD ?? 'e2e-backoffice-password',
            MAINTENANCE_MODE: 'false'
        }
    }
});
