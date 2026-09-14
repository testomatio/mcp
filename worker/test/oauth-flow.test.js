import { SELF, env } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';

const CLIENT_REDIRECT = 'https://claude.test/api/mcp/callback';

async function registerClient() {
  const response = await SELF.fetch('https://mcp.testomat.test/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Claude',
      redirect_uris: [CLIENT_REDIRECT],
      token_endpoint_auth_method: 'none',
    }),
  });

  expect(response.status).toBe(201);
  return response.json();
}

async function startAuthorization(clientId) {
  const url = new URL('https://mcp.testomat.test/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', CLIENT_REDIRECT);
  url.searchParams.set('state', 'client-state');
  url.searchParams.set('code_challenge', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  url.searchParams.set('code_challenge_method', 'S256');

  return SELF.fetch(url.toString(), { redirect: 'manual' });
}

describe('protected resource metadata', () => {
  it('is served path scoped for the project endpoint', async () => {
    const response = await SELF.fetch(
      'https://mcp.testomat.test/.well-known/oauth-protected-resource/mcp/demo-project'
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      resource: 'https://mcp.testomat.test/mcp/demo-project',
      authorization_servers: ['https://mcp.testomat.test'],
    });
  });
});

describe('oauth authorize', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores the request in KV and redirects to Testomat.io with an opaque state', async () => {
    const client = await registerClient();
    const response = await startAuthorization(client.client_id);

    expect(response.status).toBe(302);

    const location = new URL(response.headers.get('Location'));
    expect(location.origin).toBe('https://api.testomat.test');
    expect(location.pathname).toBe('/mcp/authorize');

    const state = location.searchParams.get('state');
    expect(state).toMatch(/^[0-9a-f]{32}$/);
    expect(location.search).not.toContain(CLIENT_REDIRECT);

    const stored = JSON.parse(await env.OAUTH_KV.get(`mcp_auth_request:${state}`));
    expect(stored.clientId).toBe(client.client_id);
    expect(stored.redirectUri).toBe(CLIENT_REDIRECT);
  });

  it('exchanges the opaque code server to server and completes the grant', async () => {
    const client = await registerClient();
    const authorize = await startAuthorization(client.client_id);
    const state = new URL(authorize.headers.get('Location')).searchParams.get('state');

    const exchanges = [];
    const realFetch = globalThis.fetch;

    vi.stubGlobal('fetch', async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.url);

      if (url.hostname === 'api.testomat.test') {
        exchanges.push({
          url: url.toString(),
          method: init?.method,
          secret: new Headers(init?.headers).get('X-Mcp-Worker-Secret'),
          body: JSON.parse(init?.body),
        });

        return new Response(
          JSON.stringify({ token: 'testomat_granted', user_id: 42, user_email: 'qa@testomat.test' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return realFetch(input, init);
    });

    const callback = await SELF.fetch(
      `https://mcp.testomat.test/callback?code=opaque-code&state=${state}`,
      { redirect: 'manual' }
    );

    expect(callback.status).toBe(302);

    const redirect = new URL(callback.headers.get('Location'));
    expect(redirect.toString().startsWith(CLIENT_REDIRECT)).toBe(true);
    expect(redirect.searchParams.get('code')).toBeTruthy();
    expect(redirect.searchParams.get('state')).toBe('client-state');

    expect(exchanges).toEqual([
      {
        url: 'https://api.testomat.test/mcp/authorize/exchange',
        method: 'POST',
        secret: 'worker-secret',
        body: { code: 'opaque-code' },
      },
    ]);

    expect(await env.OAUTH_KV.get(`mcp_auth_request:${state}`)).toBeNull();
  });

  it('rejects a callback whose state is unknown', async () => {
    const response = await SELF.fetch('https://mcp.testomat.test/callback?code=x&state=missing', {
      redirect: 'manual',
    });

    expect(response.status).toBe(400);
  });
});

describe('static bearer bypass', () => {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };

  it.each(['testomat_project_token', 'tstmt_project_token'])(
    'passes %s straight to the mcp handler',
    async (token) => {
      const response = await SELF.fetch('https://mcp.testomat.test/mcp/demo-project', {
        method: 'POST',
        headers: { ...headers, Authorization: `Bearer ${token}` },
        body,
      });

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.result.tools.length).toBeGreaterThan(50);
    }
  );

  it('sends an unknown token shape to the oauth provider', async () => {
    const response = await SELF.fetch('https://mcp.testomat.test/mcp/demo-project', {
      method: 'POST',
      headers: { ...headers, Authorization: 'Bearer not-a-testomatio-token' },
      body,
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toContain('resource_metadata=');
  });
});
