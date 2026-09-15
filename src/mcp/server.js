import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';
import { ToolRegistry } from './tool-registry.js';
import { createLogger } from '../core/logger.js';
import { getPackageVersion } from '../config/package-version.js';

export class TestomatioMCPServer {
  constructor({
    config,
    apiClient,
    logger,
    tools = TOOL_DEFINITIONS,
    name = 'testomatio-mcp-server',
    registryOptions = {},
    version,
    jsonSchemaValidator,
  }) {
    this.config = config;
    this.apiClient = apiClient;
    this.logger = logger || createLogger();
    this.tools = tools;
    this.toolRegistry = new ToolRegistry({
      config,
      apiClient,
      logger: this.logger,
      tools,
      ...registryOptions,
    });
    this.closePromise = null;
    this.sessionCleanupPromise = null;

    this.server = new Server(
      {
        name,
        version: version || getPackageVersion(),
      },
      {
        capabilities: {
          tools: {},
        },
        jsonSchemaValidator,
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments || {};
      this.logger.info('Tool call', { toolName });

      return this.toolRegistry.execute(toolName, args);
    });
  }

  async connect(transport) {
    await this.server.connect(transport);
  }

  async run() {
    await this.connect(new StdioServerTransport());
    this.installSessionCleanup();
    this.logger.info('Testomatio MCP server started');
  }

  close() {
    if (!this.closePromise) {
      this.closePromise = (async () => {
        try {
          await this.server.close();
        } finally {
          await this.#stopSession();
        }
      })();
    }

    return this.closePromise;
  }

  installSessionCleanup() {
    this.server.onclose = () => {
      void this.#stopSession();
    };

    process.once('beforeExit', () => {
      void this.#stopSession();
    });

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, async () => {
        await this.#stopSession();
        process.exit(0);
      });
    }
  }

  #stopSession() {
    if (!this.sessionCleanupPromise) {
      this.sessionCleanupPromise = Promise.resolve().then(() => this.apiClient?.stopSession?.());
    }

    return this.sessionCleanupPromise;
  }
}
