import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from '../src/mcp/tool-registry.js';
import { TOOL_DEFINITIONS } from '../src/mcp/tool-definitions.js';
import { ENTITY_COMMANDS } from '../src/mcp/entity-commands.js';
import { DEFAULT_TOOL_RESPONSE } from '../src/config/constants.js';

const silentLogger = {
  error() {},
  warn() {},
  info() {},
  debug() {},
};

function createRegistry(apiClientOverrides = {}) {
  const apiClient = {
    list: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, per_page: 10 } }),
    get: vi.fn().mockResolvedValue({ data: { id: 'x' } }),
    create: vi.fn().mockResolvedValue({ data: { id: 'new' } }),
    update: vi.fn().mockResolvedValue({ data: { id: 'x' } }),
    delete: vi.fn().mockResolvedValue({ data: { id: 'x' } }),
    ...apiClientOverrides,
  };

  const registry = new ToolRegistry({
    config: { projectId: 'dispatch-project', baseUrl: 'https://app.testomat.io' },
    apiClient,
    logger: silentLogger,
  });

  return { registry, apiClient };
}

async function resultOf(registry, name, args) {
  const response = await registry.execute(name, args);
  return JSON.parse(response.content[0].text);
}

describe('command dispatch', () => {
  it('routes a list command to the entity list op', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'runs', { command: 'list', tql: 'priority:high' });

    expect(apiClient.list).toHaveBeenCalled();
    const [resource, query] = apiClient.list.mock.calls[0];
    expect(resource).toBe('runs');
    expect(query.tql).toBe('priority:high');
    expect(query.command).toBeUndefined();
  });

  it('routes a get command with the entity id', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'tests', { command: 'get', test_id: 'be779025' });

    expect(apiClient.get).toHaveBeenCalledWith('tests', 'be779025', {});
  });

  it('routes a scoped issues command', async () => {
    const apiClientOverrides = {
      createWithQuery: vi.fn().mockResolvedValue({ data: { id: 'issue1' } }),
    };
    const { registry, apiClient } = createRegistry(apiClientOverrides);

    await resultOf(registry, 'tests', { command: 'issues_link', test_id: 'be779025', jira_id: 'PROJ-1' });

    expect(apiClient.createWithQuery).toHaveBeenCalledWith('issues', {
      query: { test_id: 'be779025' },
      body: { url: undefined, jira_id: 'PROJ-1' },
    });
  });

  it('does not leak the command argument into payloads', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'labels', { command: 'create', title: 'smoke' });

    const [resource, body] = apiClient.create.mock.calls[0];
    expect(resource).toBe('labels');
    expect(body).toEqual({ title: 'smoke' });
  });

  it('rejects an unknown command with the valid command list', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'tests', { command: 'explode' });

    expect(result.error).toContain('Unknown command "explode"');
    expect(result.error).toContain(ENTITY_COMMANDS.tests.join(', '));
    expect(apiClient.list).not.toHaveBeenCalled();
    expect(apiClient.create).not.toHaveBeenCalled();
  });

  it('rejects a missing command with the valid command list', async () => {
    const { registry } = createRegistry();

    const result = await resultOf(registry, 'tests', { test_id: 'be779025' });

    expect(result.error).toContain('Unknown command (missing)');
    expect(result.error).toContain('Valid commands:');
  });

  it('routes the tags search command (regression: unregistered op)', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'tags', { command: 'search', query: 'smoke' });

    expect(apiClient.get).toHaveBeenCalledWith('tags', 'smoke');
  });

  it('reports an unregistered op as an unknown command, not a TypeError', async () => {
    const { registry } = createRegistry();

    // A command declared in the enum whose op never got registered
    const handler = registry.buildCommandHandler('runs', ['list', 'get'], {});

    await expect(handler({ command: 'list' })).rejects.toThrow('Unknown command "list"');
  });
});

describe('handler wiring', () => {
  it('exposes one handler per advertised tool', () => {
    const { registry } = createRegistry();
    for (const tool of TOOL_DEFINITIONS) {
      expect(registry.handlers[tool.name], `missing handler for ${tool.name}`).toBeDefined();
    }
  });

  it('dispatches singletons directly (no command)', async () => {
    const { registry } = createRegistry();

    const result = await resultOf(registry, 'system_ping', {});

    expect(result.status).toBe('ok');
  });

  it('keeps the stub fallback for tools without handlers', async () => {
    const customTool = { name: 'custom_future_tool', description: 'not implemented yet', inputSchema: { type: 'object', properties: {} } };
    const { registry } = createRegistry();
    const customRegistry = new ToolRegistry({
      config: { projectId: 'p', baseUrl: 'https://app.testomat.io' },
      apiClient: registry.apiClient,
      logger: silentLogger,
      tools: [customTool],
    });

    const response = await customRegistry.execute('custom_future_tool', {});
    expect(response.content[0].text).toBe(`${DEFAULT_TOOL_RESPONSE} (custom_future_tool)`);
  });
});
