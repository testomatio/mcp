import { TestomatioApiClient } from './api/testomatio-client.js';
import { loadConfig } from './config/load-config.js';
import { ConfigurationError } from './core/errors.js';
import { createLogger } from './core/logger.js';
import { TestomatioMCPServer } from './mcp/server.js';
import { TOOL_DEFINITIONS } from './mcp/tool-definitions.js';

export { TestomatioMCPServer };
export { ConfigurationError, TOOL_DEFINITIONS };

export function createApplication(argvOptions = {}, serverOptions = {}) {
  const config = loadConfig(argvOptions);
  const logger = createLogger();
  const apiClient = new TestomatioApiClient({ ...config, logger });
  const mcpServer = new TestomatioMCPServer({
    config,
    apiClient,
    logger,
    ...serverOptions,
  });

  return {
    config,
    logger,
    apiClient,
    mcpServer,
  };
}
