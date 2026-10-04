import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from '../src/mcp/tool-registry.js';
import { isToolInProfile } from '../src/mcp/tool-profiles.js';

const silentLogger = {
  error() {},
  warn() {},
  info() {},
  debug() {},
};

function createRegistry() {
  const apiClient = {
    list: vi.fn().mockResolvedValue({ data: [{ title: 'Auth', failed_count: 2 }] }),
  };

  const registry = new ToolRegistry({
    config: { projectId: 'project', baseUrl: 'https://app.testomat.io' },
    apiClient,
    logger: silentLogger,
  });

  return { registry, apiClient };
}

describe('runs_stats', () => {
  it('fetches the breakdown for a run dimension', async () => {
    const { registry, apiClient } = createRegistry();

    const response = await registry.execute('runs_stats', {
      run_id: '2042ea84',
      dimension: 'suites',
      page: 2,
      sort_field: 'failed_count',
      sort_direction: 'desc',
    });

    expect(JSON.parse(response.content[0].text)).toEqual({
      data: [{ title: 'Auth', failed_count: 2 }],
    });
    expect(apiClient.list).toHaveBeenCalledWith('runs/2042ea84/stats/suites', {
      page: 2,
      sort_field: 'failed_count',
      sort_direction: 'desc',
    });
  });

  it('is available in the read profile', () => {
    expect(isToolInProfile('runs_stats', 'read')).toBe(true);
  });
});
