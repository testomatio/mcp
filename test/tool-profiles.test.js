import test from 'node:test';
import assert from 'node:assert/strict';

import { selectTools } from '../src/mcp/tool-profiles.js';
import { createEnterpriseApplication } from '../packages/enterprise/src/main.js';

const chartTools = [
  { name: 'analytics_charts_list' },
  { name: 'analytics_charts_get' },
  { name: 'analytics_charts_results' },
];

test('read profile includes every read-only analytics chart tool', () => {
  assert.deepEqual(
    selectTools(chartTools, 'read').map((tool) => tool.name),
    chartTools.map((tool) => tool.name)
  );
});

test('read profile still excludes mutating tools', () => {
  const tools = [...chartTools, { name: 'analytics_charts_create' }];

  assert.deepEqual(
    selectTools(tools, 'read').map((tool) => tool.name),
    chartTools.map((tool) => tool.name)
  );
});

test('enterprise read profile exposes analytics chart results', () => {
  const app = createEnterpriseApplication({ token: 'token', project: 'project', tools: 'read' });
  const names = app.mcpServer.tools.map((tool) => tool.name);

  assert.ok(names.includes('analytics_charts_list'));
  assert.ok(names.includes('analytics_charts_get'));
  assert.ok(names.includes('analytics_charts_results'));
});

test('analytics chart results calls the backend result endpoint with pagination', async () => {
  const app = createEnterpriseApplication({ token: 'token', project: 'project', tools: 'read' });
  const calls = [];
  app.mcpServer.toolRegistry.apiClient = {
    async list(resource, query) {
      calls.push({ resource, query });
      return { data: [{ id: 'test-1', title: 'Login' }], meta: { page: 2, per_page: 25, total: 26 } };
    },
  };

  const response = await app.mcpServer.toolRegistry.execute('analytics_charts_results', {
    chart_id: 'chart-1',
    number: 0,
    page: 2,
    per_page: 25,
  });

  assert.deepEqual(calls, [
    {
      resource: 'analytics/charts/chart-1/result',
      query: { number: 0, page: 2, per_page: 25 },
    },
  ]);
  assert.match(response.content[0].text, /"id":"test-1"/);
});
