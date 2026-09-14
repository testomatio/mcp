import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['test/**/*.test.js'],
        },
      },
      {
        plugins: [
          cloudflareTest({
            main: './worker/src/index.js',
            wrangler: { configPath: './worker/wrangler.jsonc' },
            miniflare: {
              bindings: {
                TESTOMATIO_BASE_URL: 'https://api.testomat.test',
                TESTOMATIO_MCP_WORKER_SECRET: 'worker-secret',
              },
              kvNamespaces: ['OAUTH_KV'],
            },
          }),
        ],
        test: {
          name: 'worker',
          include: ['worker/test/**/*.test.js'],
        },
      },
    ],
  },
});
