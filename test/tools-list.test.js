import { describe, expect, it } from 'vitest';
import { TestomatioMCPServer } from '../src/mcp/server.js';
import { TOOL_DEFINITIONS } from '../src/mcp/tool-definitions.js';

const silentLogger = {
  error() {},
  warn() {},
  info() {},
  debug() {},
};

function createCaptureTransport() {
  const sent = [];

  return {
    sent,
    async start() {},
    async send(message) {
      sent.push(message);
    },
    async close() {},
  };
}

async function waitForResponse(transport, id) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const found = transport.sent.find((message) => message.id === id);
    if (found) {
      return found;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  throw new Error(`No response captured for request id ${id}`);
}

async function connectServer() {
  const server = new TestomatioMCPServer({
    config: {
      token: 'tstmt_snapshot_token',
      projectId: 'snapshot-project',
      baseUrl: 'https://app.testomat.io',
    },
    apiClient: {},
    logger: silentLogger,
  });

  const transport = createCaptureTransport();
  await server.server.connect(transport);

  transport.onmessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'snapshot-client', version: '1.0.0' },
    },
  });

  await waitForResponse(transport, 1);
  transport.onmessage({ jsonrpc: '2.0', method: 'notifications/initialized' });

  return { server, transport };
}

describe('tools/list', () => {
  it('returns the full tool catalog', async () => {
    const { transport } = await connectServer();

    transport.onmessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    const response = await waitForResponse(transport, 2);

    expect(response.error).toBeUndefined();
    expect(response.result.tools).toHaveLength(TOOL_DEFINITIONS.length);
    expect(response.result).toMatchSnapshot();
  });

  it('advertises tool capability on initialize', async () => {
    const { transport } = await connectServer();
    const response = await waitForResponse(transport, 1);

    expect(response.result.capabilities.tools).toBeDefined();
    expect(response.result.serverInfo.name).toBe('testomatio-mcp-server');
  });
});
