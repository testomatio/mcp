import { SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';

const MCP_URL = 'https://mcp.testomat.test/mcp/demo-project';
const MCP_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
  Authorization: 'Bearer tstmt_revoked_token',
};

function stubApi(status, body) {
  const realFetch = globalThis.fetch;

  vi.stubGlobal('fetch', async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url);

    if (url.hostname === 'api.testomat.test') {
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return realFetch(input, init);
  });
}

async function callTool() {
  return SELF.fetch(MCP_URL, {
    method: 'POST',
    headers: MCP_HEADERS,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'tests_list', arguments: {} },
    }),
  });
}

describe('revoked tokens', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a revoked-token 403 to 401 with WWW-Authenticate', async () => {
    stubApi(403, { error: 'Invalid or paused token', code: 'token_invalid' });

    const response = await callTool();

    expect(response.status).toBe(401);

    const challenge = response.headers.get('WWW-Authenticate');
    expect(challenge).toContain('Bearer');
    expect(challenge).toContain('error="invalid_token"');
    expect(challenge).toContain(
      'resource_metadata="https://mcp.testomat.test/.well-known/oauth-protected-resource/mcp/demo-project"'
    );

    const metadata = await SELF.fetch(
      challenge.match(/resource_metadata="([^"]+)"/)[1]
    );
    expect(metadata.status).toBe(200);
  });

  it('leaves a successful tool call untouched', async () => {
    stubApi(200, { data: [] });

    const response = await callTool();

    expect(response.status).toBe(200);
    expect(response.headers.get('WWW-Authenticate')).toBeNull();
  });

  it('does not mask other upstream failures as authentication failures', async () => {
    stubApi(422, { message: 'Invalid filter' });

    const response = await callTool();

    expect(response.status).toBe(200);
    expect(response.headers.get('WWW-Authenticate')).toBeNull();
  });

  it('leaves an uncoded 403 alone so authorization failures do not loop', async () => {
    stubApi(403, { error: 'Read-only users cannot access this API' });

    const response = await callTool();

    expect(response.status).toBe(200);
    expect(response.headers.get('WWW-Authenticate')).toBeNull();
  });

  it('leaves a permission 403 alone even though the token itself is valid', async () => {
    stubApi(403, { error: 'Token does not have permission' });

    const response = await callTool();

    expect(response.status).toBe(200);
    expect(response.headers.get('WWW-Authenticate')).toBeNull();
  });

  it('rejects a request without a token', async () => {
    const response = await SELF.fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toContain('Bearer');
  });
});
