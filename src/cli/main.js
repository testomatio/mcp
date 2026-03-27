#!/usr/bin/env node

import { Command } from 'commander';
import { createApplication } from '../index.js';
import { ConfigurationError } from '../core/errors.js';

export function parseArgs(argv = process.argv) {
  const command = new Command();

  command
    .name('testomatio-mcp')
    .description('Model Context Protocol server for Testomatio API v2')
    .version('2.0.0-scaffold')
    .option('-t, --token <token>', 'Testomatio Project token')
    .option('-p, --project <project>', 'Project ID')
    .option('--base-url <url>', 'Base URL for Testomatio API')
    .parse(argv);

  return command.opts();
}

export async function main(argv = process.argv) {
  try {
    const options = parseArgs(argv);
    const app = createApplication(options);
    await app.mcpServer.run();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(`Configuration error: ${error.message}`);
      process.exit(1);
    }

    console.error('Failed to start server:', error.message || error);
    process.exit(1);
  }
}
