import { TestomatioApiClient } from '../api/testomatio-client.js';
import { createLogger } from '../core/logger.js';
import { TestomatioMCPServer } from './server.js';

export function createMcpServer({ token, projectId, baseUrl, logger, version, jsonSchemaValidator }) {
  const config = { token, projectId, baseUrl };
  const serverLogger = logger || createLogger();

  return new TestomatioMCPServer({
    config,
    apiClient: new TestomatioApiClient({ ...config, logger: serverLogger }),
    logger: serverLogger,
    version,
    jsonSchemaValidator,
  });
}
