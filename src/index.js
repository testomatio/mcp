import { TestomatioApiClient } from './api/testomatio-client.js';
import { loadConfig } from './config/load-config.js';
import { ConfigurationError } from './core/errors.js';
import { createLogger } from './core/logger.js';
import { TestomatioMCPServer } from './mcp/server.js';
import { TOOL_DEFINITIONS } from './mcp/tool-definitions.js';
import { slimList, withListOptions } from './mcp/list-projection.js';
import { selectTools } from './mcp/tool-profiles.js';
import {
  ANALYTICS_STATS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_STATS_TQL_REFERENCE,
  ANALYTICS_TESTS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_TESTS_TQL_REFERENCE,
} from './mcp/definitions/tql-reference.js';

export { TestomatioMCPServer };
export {
  ANALYTICS_STATS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_STATS_TQL_REFERENCE,
  ANALYTICS_TESTS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_TESTS_TQL_REFERENCE,
  ConfigurationError,
  TOOL_DEFINITIONS,
  slimList,
  withListOptions,
  selectTools,
};

export function createApplication(argvOptions = {}, serverOptions = {}) {
  const config = loadConfig(argvOptions);
  const logger = createLogger();
  const apiClient = new TestomatioApiClient({ ...config, logger });
  const { tools: overrideTools, ...restServerOptions } = serverOptions;
  const mcpServer = new TestomatioMCPServer({
    config,
    apiClient,
    logger,
    tools: selectTools(overrideTools ?? TOOL_DEFINITIONS, config.toolsProfile),
    ...restServerOptions,
  });

  return {
    config,
    logger,
    apiClient,
    mcpServer,
  };
}
