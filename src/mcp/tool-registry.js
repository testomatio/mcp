import { DEFAULT_TOOL_RESPONSE } from '../config/constants.js';
import { ApiError, NotImplementedToolError } from '../core/errors.js';
import { textResponse } from '../helpers/mcp-response.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';
import { handlerMethods } from './registry/handlers.js';
import { issueMethods } from './registry/issues.js';
import { listingMethods } from './registry/listings.js';
import { payloadMethods } from './registry/payloads.js';

function formatJson(payload) {
  return JSON.stringify(payload, null, 2);
}

export class ToolRegistry {
  constructor({ config, apiClient, logger }) {
    this.config = config;
    this.apiClient = apiClient;
    this.logger = logger;
    this.handlers = this.buildHandlers();
  }

  asText(payload) {
    return textResponse(formatJson(payload));
  }

  buildHandlers() {
    const handlers = {
      system_ping: async () =>
        this.asText({
          status: 'ok',
          projectId: this.config.projectId,
          baseUrl: this.config.baseUrl,
          apiVersion: 'v2',
        }),
    };

    this.registerEntityCrudHandlers(handlers);
    this.registerScopedIssueHandlers(handlers);
    this.registerGlobalHandlers(handlers);

    for (const tool of TOOL_DEFINITIONS) {
      if (tool.name === 'system_ping') continue;
      if (!handlers[tool.name]) {
        handlers[tool.name] = async () => textResponse(`${DEFAULT_TOOL_RESPONSE} (${tool.name})`);
      }
    }

    return handlers;
  }

  async execute(name, args = {}) {
    const handler = this.handlers[name];
    if (!handler) {
      throw new NotImplementedToolError(name);
    }

    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof ApiError) {
        return this.asText({
          error: error.message,
          status: error.status,
          url: error.url,
          details: error.payload || null,
        });
      }

      this.logger?.error('Unhandled tool execution error', { name, error: error?.message || error });
      return this.asText({ error: error?.message || 'Unknown execution error' });
    }
  }
}

Object.assign(
  ToolRegistry.prototype,
  handlerMethods,
  listingMethods,
  issueMethods,
  payloadMethods
);
