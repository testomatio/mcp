#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { main } from './src/cli/main.js';
export * from './src/index.js';

const modulePath = fileURLToPath(import.meta.url);
const executedPath = process.argv[1] || '';
const isDirectExecution =
  executedPath === modulePath ||
  executedPath.endsWith('/index.js') ||
  executedPath.endsWith('\\index.js') ||
  executedPath.endsWith('/testomatio-mcp') ||
  executedPath.endsWith('\\testomatio-mcp');

if (isDirectExecution) {
  main(process.argv).catch((error) => {
    console.error('Fatal startup error:', error.message || error);
    process.exit(1);
  });
}
