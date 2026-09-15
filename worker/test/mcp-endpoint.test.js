import { SELF } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = 'https://mcp.testomat.test/mcp/demo-project';
const STATIC_TOKEN = 'tstmt_static_token';

const TESTS_PAYLOAD = {
  data: [
    { id: '1', type: 'test', attributes: { title: 'User can sign in' } },
    { id: '2', type: 'test', attributes: { title: 'User can sign out' } },
  ],
};

function stubApi(handler) {
  const realFetch = globalThis.fetch;

  vi.stubGlobal('fetch', async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url);

    if (url.hostname === 'api.testomat.test') {
      return handler(url, init);
    }

    return realFetch(input, init);
  });
}

function connect() {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers: { Authorization: `Bearer ${STATIC_TOKEN}` } },
    fetch: (input, init) => SELF.fetch(input, init),
  });

  const client = new Client({ name: 'worker-e2e', version: '1.0.0' });
  return { client, transport };
}

describe('POST /mcp/<project_id>', () => {
  let calls;

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('completes initialize, tools/list and tools/call', async () => {
    stubApi((url, init) => {
      calls.push({ url: url.toString(), authorization: new Headers(init?.headers).get('Authorization') });
      return new Response(JSON.stringify(TESTS_PAYLOAD), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const { client, transport } = connect();
    await client.connect(transport);

    expect(client.getServerVersion()?.name).toBe('testomatio-mcp-server');

    const { tools } = await client.listTools();
    expect(tools.length).toBeGreaterThan(50);
    expect(tools.map((tool) => tool.name)).toContain('tests_list');

    const result = await client.callTool({ name: 'tests_list', arguments: { page: 1, per_page: 2 } });
    const payload = JSON.parse(result.content[0].text);
    expect(payload.data.map((test) => test.id)).toEqual(['1', '2']);
    expect(payload.data.map((test) => test.attributes.title)).toEqual(
      TESTS_PAYLOAD.data.map((test) => test.attributes.title)
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('https://api.testomat.test/api/v2/demo-project/tests');
    expect(calls[0].authorization).toBe(`Bearer ${STATIC_TOKEN}`);
  });

  it('routes the project id from the url into the api path', async () => {
    stubApi((url) => {
      calls.push(url.pathname);
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const transport = new StreamableHTTPClientTransport(new URL('https://mcp.testomat.test/mcp/other-project'), {
      requestInit: { headers: { Authorization: `Bearer ${STATIC_TOKEN}` } },
      fetch: (input, init) => SELF.fetch(input, init),
    });
    const client = new Client({ name: 'worker-e2e', version: '1.0.0' });

    await client.connect(transport);
    await client.callTool({ name: 'suites_list', arguments: {} });

    expect(calls[0]).toBe('/api/v2/other-project/suites');
  });

  it('closes the Testomat.io API session after a mutating request', async () => {
    stubApi((url, init) => {
      const method = init?.method;
      calls.push({ method, path: url.pathname, session: new Headers(init?.headers).get('X-Session-Hash') });

      if (method === 'POST' && url.pathname.endsWith('/sessions')) {
        return Response.json({ data: { hash: 'session-1' } });
      }

      if (method === 'POST' && url.pathname.endsWith('/tests')) {
        return Response.json({ data: { id: 'test-1' } });
      }

      if (method === 'DELETE' && url.pathname.endsWith('/sessions/session-1')) {
        return Response.json({});
      }

      return Response.json({ error: 'Unexpected request' }, { status: 500 });
    });

    const { client, transport } = connect();
    await client.connect(transport);
    await client.callTool({
      name: 'tests_create',
      arguments: { title: 'Session cleanup', suite_id: 'suite-1' },
    });

    expect(calls).toEqual([
      { method: 'POST', path: '/api/v2/demo-project/sessions', session: null },
      { method: 'POST', path: '/api/v2/demo-project/tests', session: 'session-1' },
      { method: 'DELETE', path: '/api/v2/demo-project/sessions/session-1', session: null },
    ]);
  });

  it.each(['demo%2F..%2F..%2Fadmin', '%'])(
    'rejects an unsafe project path: %s',
    async (project) => {
      const response = await SELF.fetch(`https://mcp.testomat.test/mcp/${project}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${STATIC_TOKEN}`,
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      });

      expect(response.status).toBe(404);
    }
  );

  it.each(['GET', 'PUT', 'DELETE'])('rejects %s with 405', async (method) => {
    const response = await SELF.fetch(MCP_URL, {
      method,
      headers: { Authorization: `Bearer ${STATIC_TOKEN}` },
    });

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });
});
