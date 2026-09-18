import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from '../src/mcp/tool-registry.js';
import { selectTools } from '../src/mcp/tool-profiles.js';
import { SHARES_TOOLS } from '../src/mcp/definitions/shares.js';

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

describe('tests_share', () => {
  it('shares tests by ids', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'tests_share', {
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

    await resultOf(registry, 'tests_share', {
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

    await resultOf(registry, 'tests_share', {
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

    const result = await resultOf(registry, 'tests_share', {
      target_project_id: 'sugar-king',
      target_suite_id: 'e73d559c',
    });

    expect(result.error).toContain('test_ids');
    expect(apiClient.create).not.toHaveBeenCalled();
  });

  it('requires target_suite_id and target_project_id', async () => {
    const { registry } = createRegistry();

    const result = await resultOf(registry, 'tests_share', {
      test_ids: ['be779025'],
      target_project_id: 'sugar-king',
    });

    expect(result.error).toContain('target_suite_id');
  });
});

describe('suites_share', () => {
  it('shares suites into multiple target projects', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'suites_share', {
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

    await resultOf(registry, 'suites_share', {
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

    const result = await resultOf(registry, 'suites_share', {
      target_project_ids: ['sugar-king'],
    });

    expect(result.error).toContain('suite_ids');
    expect(apiClient.create).not.toHaveBeenCalled();
  });
});

describe('unshare', () => {
  it('unshares a test copy', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'tests_unshare', { test_id: 'shared1' });

    expect(apiClient.delete).toHaveBeenCalledWith('shares/tests', 'shared1');
  });

  it('unshares a suite copy', async () => {
    const { registry, apiClient } = createRegistry();

    await resultOf(registry, 'suites_unshare', { suite_id: 'shared2' });

    expect(apiClient.delete).toHaveBeenCalledWith('shares/suites', 'shared2');
  });

  it('requires the id', async () => {
    const { registry, apiClient } = createRegistry();

    const result = await resultOf(registry, 'tests_unshare', {});

    expect(result.error).toContain('test_id');
    expect(apiClient.delete).not.toHaveBeenCalled();
  });
});

describe('tool profiles', () => {
  it('includes share tools in the core profile but not read', () => {
    const names = selectTools(SHARES_TOOLS, 'core').map((tool) => tool.name);
    expect(names).toEqual([
      'tests_share',
      'suites_share',
      'tests_unshare',
      'suites_unshare',
    ]);

    expect(selectTools(SHARES_TOOLS, 'read')).toEqual([]);
  });
});
