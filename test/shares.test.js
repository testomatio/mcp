import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from '../src/mcp/tool-registry.js';
import { selectTools } from '../src/mcp/tool-profiles.js';
import { TESTS_TOOL } from '../src/mcp/definitions/tests.js';
import { SUITES_TOOL } from '../src/mcp/definitions/suites.js';
import { SYSTEM_TOOLS } from '../src/mcp/definitions/system.js';

const silentLogger = {
  error() {},
  warn() {},
  info() {},
  debug() {},
};

function createRegistry() {
  const apiClient = {
    create: vi.fn().mockResolvedValue({ data: { status: 'queued' } }),
    delete: vi.fn().mockResolvedValue({ data: { id: 'shared1' } }),
  };

  const registry = new ToolRegistry({
    config: { projectId: 'source-project', baseUrl: 'https://app.testomat.io' },
    apiClient,
    logger: silentLogger,
  });

  return { registry, apiClient };
}

async function resultOf(registry, name, args) {
  const response = await registry.execute(name, args);
  return JSON.parse(response.content[0].text);
}

describe('tests share command', () => {
  it('shares tests by ids', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'tests', {
      command: 'share',
      test_ids: ['be779025', 'sgqat108'],
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });

    expect(result).toEqual({ data: { status: 'queued' } });
    expect(apiClient.create).toHaveBeenCalledWith('shares/tests', {
      test_ids: ['be779025', 'sgqat108'],
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });
  });

  it('shares tests by labels and combines with ids', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'tests', {
      command: 'share',
      test_ids: ['sgqat104'],
      labels: ['pre-cert'],
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });

    expect(apiClient.create).toHaveBeenCalledWith('shares/tests', {
      test_ids: ['sgqat104'],
      labels: ['pre-cert'],
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });
  });

  it('shares tests by labels only', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'tests', {
      command: 'share',
      labels: ['pre-cert'],
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });

    expect(apiClient.create).toHaveBeenCalledWith('shares/tests', {
      labels: ['pre-cert'],
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });
  });

  it('requires a selection', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'tests', {
      command: 'share',
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });

    expect(result.error).toContain('test_ids');
    expect(apiClient.create).not.toHaveBeenCalled();
  });

  it('requires target_suite_id and target_project_id', async () => {
    const { registry } = createRegistry();

    const result = await resultOf(registry, 'tests', {
      command: 'share',
      test_ids: ['be779025'],
      target_project_id: 'sugar-king',
    });

    expect(result.error).toContain('target_suite_id');
  });
});

describe('suites share command', () => {
  it('shares suites into multiple target projects', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'suites', {
      command: 'share',
      suite_ids: ['e73d559c'],
      target_project_ids: ['sugar-king', 'game-qa'],
    });

    expect(result).toEqual({ data: { status: 'queued' } });
    expect(apiClient.create).toHaveBeenCalledWith('shares/suites', {
      suite_ids: ['e73d559c'],
      target_project_ids: ['sugar-king', 'game-qa'],
    });
  });

  it('passes destination_folder_id through', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'suites', {
      command: 'share',
      labels: ['localisation'],
      target_project_ids: ['sugar-king'],
      destination_folder_id: 'folder123',
    });

    expect(apiClient.create).toHaveBeenCalledWith('shares/suites', {
      labels: ['localisation'],
      target_project_ids: ['sugar-king'],
      destination_folder_id: 'folder123',
    });
  });

  it('requires a selection', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'suites', {
      command: 'share',
      target_project_ids: ['sugar-king'],
    });

    expect(result.error).toContain('suite_ids');
    expect(apiClient.create).not.toHaveBeenCalled();
  });
});

describe('unshare command', () => {
  it('unshares a test copy', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'tests', { command: 'unshare', test_id: 'shared1' });

    expect(apiClient.delete).toHaveBeenCalledWith('shares/tests', 'shared1');
  });

  it('unshares a suite copy', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'suites', { command: 'unshare', suite_id: 'shared2' });

    expect(apiClient.delete).toHaveBeenCalledWith('shares/suites', 'shared2');
  });

  it('requires the id', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'tests', { command: 'unshare' });

    expect(result.error).toContain('test_id');
    expect(apiClient.delete).not.toHaveBeenCalled();
  });
});

describe('tool profiles', () => {
  it('keeps the full command surface in the core profile', () => {
    const [tool] = selectTools([TESTS_TOOL], 'core');
    expect(tool.name).toBe('tests');
    expect(tool.inputSchema.properties.command.enum).toEqual(TESTS_TOOL.inputSchema.properties.command.enum);
  });

  it('restricts the tests tool to read-only commands in the read profile', () => {
    const [tool] = selectTools([TESTS_TOOL], 'read');
    expect(tool.name).toBe('tests');
    expect(tool.inputSchema.properties.command.enum).toEqual([
      'list',
      'get',
      'issues_list',
      'attachments_list',
    ]);
    expect(tool.inputSchema.properties.title).toBeUndefined();
    expect(tool.inputSchema.properties.test_ids).toBeUndefined();
    expect(tool.inputSchema.properties.test_id).toBeDefined();
  });

  it('returns the tool unchanged in the full profile', () => {
    expect(selectTools([TESTS_TOOL, SUITES_TOOL], 'full')).toEqual([TESTS_TOOL, SUITES_TOOL]);
  });

  it('passes command-less singletons through the read profile', () => {
    expect(selectTools(SYSTEM_TOOLS, 'read')).toEqual(SYSTEM_TOOLS);
  });
});
