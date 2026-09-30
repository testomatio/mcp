import { DEFAULT_TOOL_RESPONSE } from '../config/constants.js';
import { ApiError, NotImplementedToolError } from '../core/errors.js';
import { textResponse } from '../helpers/mcp-response.js';
import { ENTITY_COMMANDS } from './entity-commands.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';
import { TQL_FULL_REFERENCE } from './definitions/tql-reference.js';
import { handlerMethods } from './registry/handlers.js';
import { attachmentMethods } from './registry/attachments.js';
import { issueMethods } from './registry/issues.js';
import { listingMethods } from './registry/listings.js';
import { payloadMethods } from './registry/payloads.js';
import { shareMethods } from './registry/shares.js';

function withPagination(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const meta = payload.meta;
  if (!Array.isArray(payload.data) || !meta || typeof meta !== 'object') {
    return payload;
  }
  const { total, page, per_page: perPage, has_more: backendHasMore } = meta;
  if (
    typeof total !== 'number' ||
    typeof page !== 'number' ||
    typeof perPage !== 'number' ||
    perPage <= 0
  ) {
    return payload;
  }
  const hasMore =
    typeof backendHasMore === 'boolean' ? backendHasMore : page * perPage < total;

  if (hasMore) {
    return {
      ...payload,
      _note: `Showing ${payload.data.length} of ${total} (page ${page}). More available — refine the filter or request the next page.`,
    };
  }
  return payload;
}

function formatJson(payload) {
  return JSON.stringify(payload);
}

export class ToolRegistry {
  constructor({ config, apiClient, logger, tools = TOOL_DEFINITIONS, handlerRegistrars = [] }) {
    this.config = config;
    this.apiClient = apiClient;
    this.logger = logger;
    this.tools = tools;
    this.handlerRegistrars = handlerRegistrars;
    this.handlers = this.buildHandlers();
  }

  asText(payload) {
    return textResponse(formatJson(withPagination(payload)));
  }

  buildHandlers() {
    // Ops are keyed by "<entity>_<command>" (tests_list, tests_issues_link, ...).
    const ops = {
      system_ping: async () =>
        this.asText({
          status: 'ok',
          projectId: this.config.projectId,
          baseUrl: this.config.baseUrl,
          apiVersion: 'v2',
        }),
      tql_help: async () => textResponse(TQL_FULL_REFERENCE),
    };

    this.registerEntityCrudHandlers(ops);
    this.registerScopedIssueHandlers(ops);
    this.registerScopedAttachmentHandlers(ops);
    this.registerGlobalHandlers(ops);
    this.registerShareHandlers(ops);
    for (const registerHandlers of this.handlerRegistrars) {
      registerHandlers.call(this, ops);
    }

    const handlers = {};
    for (const tool of this.tools) {
      const commands = ENTITY_COMMANDS[tool.name];
      if (commands) {
        handlers[tool.name] = this.buildCommandHandler(tool.name, commands, ops);
      } else if (ops[tool.name]) {
        // command-less singletons + custom registrar tools (e.g. enterprise analytics)
        handlers[tool.name] = ops[tool.name];
      } else {
        handlers[tool.name] = async () => textResponse(`${DEFAULT_TOOL_RESPONSE} (${tool.name})`);
      }
    }

    return handlers;
  }

  buildCommandHandler(toolName, commands, ops) {
    return async (args = {}) => {
      const { command, ...commandArgs } = args;
      const op = command ? ops[`${toolName}_${command}`] : undefined;
      if (!op) {
        throw new Error(
          `Unknown command ${command === undefined ? '(missing)' : `"${command}"`} for tool "${toolName}". Valid commands: ${commands.join(', ')}.`
        );
      }
      return op(commandArgs);
    };
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
  attachmentMethods,
  listingMethods,
  issueMethods,
  payloadMethods,
  shareMethods
);
