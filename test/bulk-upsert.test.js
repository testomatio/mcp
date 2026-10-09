import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from '../src/mcp/tool-registry.js';

const silentLogger = {
  error() {},
  warn() {},
  info() {},
  debug() {},
};

describe('tests bulk_upsert command', () => {
  it('parses markdown, resolves suites, and sends one bulk request', async () => {
    const apiClient = {
      list: vi.fn().mockResolvedValue({
        data: [{ id: 'suite-1', title: 'Login Functionality' }],
        meta: { total: 1, page: 1, per_page: 100, has_more: false },
      }),
      createWithQuery: vi.fn().mockResolvedValue({
        data: [
          { id: 'id-0', title: 'Successful Login', status: 'updated' },
          { id: 'id-1', title: 'Failed Login', status: 'created' },
        ],
      }),
    };
    const registry = new ToolRegistry({
      config: { projectId: 'bulk-project', baseUrl: 'https://app.testomat.io' },
      apiClient,
      logger: silentLogger,
    });

    const response = await registry.execute('tests', {
      command: 'bulk_upsert',
      markdown:
        '<!-- suite\nid: @S380c64db\n-->\n# Login Functionality\n' +
        '<!-- test\nid: @T12345678\npriority: high\n-->\n# Successful Login\nSome description\n' +
        '<!-- test -->\n# Failed Login\n',
    });
    const result = JSON.parse(response.content[0].text);

    expect(result.stats).toEqual({
      suites_created: 0,
      suites_reused: 1,
      tests_created: 1,
      tests_updated: 1,
      errors: 0,
    });
    expect(apiClient.createWithQuery).toHaveBeenCalledWith('tests/bulk', {
      query: {},
      body: {
        tests: [
          { id: '12345678', title: 'Successful Login', suite_id: 'suite-1', priority: 'high', description: 'Some description' },
          { title: 'Failed Login', suite_id: 'suite-1' },
        ],
      },
    });
  });
});
