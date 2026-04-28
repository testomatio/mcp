#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigurationError, createApplication } from './load-core.js';
import { ENTERPRISE_TOOL_DEFINITIONS, registerAnalyticsHandlers } from './analytics.js';
import { getPackageVersion } from './package-version.js';

export function parseArgs(argv = process.argv) {
  const command = new Command();

  command
    .name('testomatio-mcp-enterprise')
    .description('Enterprise Model Context Protocol server for Testomat.io API v2')
    .version(getPackageVersion())
    .option('-t, --token <token>', 'Testomatio Project token')
    .option('-p, --project <project>', 'Project ID')
    .option('--base-url <url>', 'Base URL for Testomat.io API')
    .parse(argv);

  return command.opts();
}

export function createEnterpriseApplication(argvOptions = {}) {
  return createApplication(argvOptions, {
    tools: ENTERPRISE_TOOL_DEFINITIONS,
    name: 'testomatio-mcp-enterprise-server',
    registryOptions: {
      handlerRegistrars: [registerAnalyticsHandlers],
    },
  });
}

export async function main(argv = process.argv) {
  try {
    const options = parseArgs(argv);
    const app = createEnterpriseApplication(options);
    await app.mcpServer.run();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(`Configuration error: ${error.message}`);
      process.exit(1);
    }

    console.error('Failed to start enterprise server:', error.message || error);
    process.exit(1);
  }
}
