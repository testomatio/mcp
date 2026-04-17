import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';
import { ToolRegistry } from './tool-registry.js';
import { createLogger } from '../core/logger.js';
import { getPackageVersion } from '../config/package-version.js';

export class TestomatioMCPServer {
  constructor({ config, apiClient, logger }) {
    this.config = config;
    this.apiClient = apiClient;
    this.logger = logger || createLogger();
    this.cleanupStarted = false;
    this.toolRegistry = new ToolRegistry({ config, apiClient, logger: this.logger });

    this.server = new Server(
      {
        name: 'testomatio-mcp-server',
        version: getPackageVersion(),
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments || {};
      this.logger.info('Tool call', { toolName });

      return this.toolRegistry.execute(toolName, args);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.installSessionCleanup();
    this.logger.info('Testomatio MCP server started');
  }

  installSessionCleanup() {
    const cleanup = async () => {
      if (this.cleanupStarted) {
        return;
      }

      this.cleanupStarted = true;
      await this.apiClient?.stopSession?.();
    };

    this.server.onclose = () => {
      void cleanup();
    };

    process.once('beforeExit', () => {
      void cleanup();
    });

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, async () => {
        await cleanup();
        process.exit(0);
      });
    }
  }
}
