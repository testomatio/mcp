import { describe, expect, it, vi } from 'vitest';
import { createMcpServer } from '../src/mcp/create-server.js';

describe('createMcpServer', () => {
  it('builds a request scoped server', () => {
    const server = createMcpServer({
      token: 'tstmt_x',
      projectId: 'demo',
      baseUrl: 'https://beta.testomat.io',
    });

    expect(server.config).toEqual({
      token: 'tstmt_x',
      projectId: 'demo',
      baseUrl: 'https://beta.testomat.io',
    });
    expect(server.toolRegistry.apiClient.projectId).toBe('demo');
    expect(server.toolRegistry.apiClient.http.baseUrl).toBe('https://beta.testomat.io');
    expect(typeof server.connect).toBe('function');
    expect(typeof server.close).toBe('function');
  });

  it('isolates configuration per instance', () => {
    const first = createMcpServer({ token: 'a', projectId: 'one', baseUrl: 'https://app.testomat.io' });
    const second = createMcpServer({ token: 'b', projectId: 'two', baseUrl: 'https://beta.testomat.io' });

    expect(first.toolRegistry.apiClient.http.token).toBe('a');
    expect(second.toolRegistry.apiClient.http.token).toBe('b');
    expect(first.toolRegistry.apiClient.projectId).toBe('one');
    expect(second.toolRegistry.apiClient.projectId).toBe('two');
  });

  it('closes the server and its API session only once', async () => {
    const server = createMcpServer({ token: 'a', projectId: 'one', baseUrl: 'https://app.testomat.io' });
    const stopSession = vi.fn(async () => {});
    const closeProtocol = vi.fn(async () => {});
    server.apiClient.stopSession = stopSession;
    server.server.close = closeProtocol;

    await Promise.all([server.close(), server.close()]);

    expect(closeProtocol).toHaveBeenCalledTimes(1);
    expect(stopSession).toHaveBeenCalledTimes(1);
  });
});
