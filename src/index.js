import { TestomatioApiClient } from './api/testomatio-client.js';
import { loadConfig } from './config/load-config.js';
import { createLogger } from './core/logger.js';
import { TestomatioMCPServer } from './mcp/server.js';

export { TestomatioMCPServer };

export function createApplication(argvOptions = {}) {
  const config = loadConfig(argvOptions);
  const logger = createLogger();
  const apiClient = new TestomatioApiClient({ ...config, logger });
  const mcpServer = new TestomatioMCPServer({ config, apiClient, logger });

  return {
    config,
    logger,
    apiClient,
    mcpServer,
  };
}
