#!/usr/bin/env node

import { main } from './src/main.js';

main(process.argv).catch((error) => {
  console.error('Fatal startup error:', error.message || error);
  process.exit(1);
});
