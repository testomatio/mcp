import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';
import { ToolRegistry } from './tool-registry.js';
import { createLogger } from '../core/logger.js';

export class TestomatioMCPServer {
  constructor({ config, apiClient, logger }) {
    this.config = config;
    this.logger = logger || createLogger();
    this.toolRegistry = new ToolRegistry({ config, apiClient, logger: this.logger });

    this.server = new Server(
      {
        name: 'testomatio-mcp-server',
        version: '2.0.0-scaffold',
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
    this.logger.info('Testomatio MCP server started');
  }
}
