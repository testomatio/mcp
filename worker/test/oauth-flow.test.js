import { SELF, env } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';

const CLIENT_REDIRECT = 'https://claude.test/api/mcp/callback';
const MCP_RESOURCE = 'https://mcp.testomat.test/mcp/demo-project';
const ACCOUNT_RESOURCE = 'https://mcp.testomat.test/mcp';

async function registerClient(redirectUri = CLIENT_REDIRECT) {
  const response = await SELF.fetch('https://mcp.testomat.test/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Claude',
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
    }),
  });

  expect(response.status).toBe(201);
  return response.json();
}

async function startAuthorization(clientId, resource = MCP_RESOURCE, redirectUri = CLIENT_REDIRECT) {
  const url = new URL('https://mcp.testomat.test/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', 'client-state');
  url.searchParams.set('code_challenge', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  url.searchParams.set('code_challenge_method', 'S256');
  for (const value of Array.isArray(resource) ? resource : [resource]) {
    if (value) {
      url.searchParams.append('resource', value);
    }
  }

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

  it.each([
    ['a missing resource', ''],
    ['the account resource with a trailing slash', 'https://mcp.testomat.test/mcp/'],
    ['the account resource with an empty query', 'https://mcp.testomat.test/mcp?'],
    ['the account resource with an empty fragment', 'https://mcp.testomat.test/mcp#'],
    ['an unsafe project id', 'https://mcp.testomat.test/mcp/demo%2F..%2F..%2Fadmin'],
    ['a resource on another origin', 'https://attacker.test/mcp/demo-project'],
    ['multiple resources', [MCP_RESOURCE, 'https://mcp.testomat.test/mcp/other-project']],
  ])('rejects %s', async (_label, resource) => {
    const client = await registerClient();
    const response = await startAuthorization(client.client_id, resource);

    expect(response.status).toBe(400);
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

async function authorizeGrant(client, resource, redirectUri = CLIENT_REDIRECT) {
  const authorize = await startAuthorization(client.client_id, resource, redirectUri);
  expect(authorize.status).toBe(302);
  const state = new URL(authorize.headers.get('Location')).searchParams.get('state');
  const callback = await SELF.fetch(
    `https://mcp.testomat.test/callback?code=opaque-code&state=${state}`,
    { redirect: 'manual' }
  );
  expect(callback.status).toBe(302);
  const code = new URL(callback.headers.get('Location')).searchParams.get('code');
  const response = await SELF.fetch('https://mcp.testomat.test/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: client.client_id,
      redirect_uri: redirectUri,
      code,
      code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      resource,
    }),
  });
  expect(response.status).toBe(200);
  return response.json();
}

function stubConsentExchange() {
  const realFetch = globalThis.fetch;
  vi.stubGlobal('fetch', (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.hostname === 'api.testomat.test') {
      return Promise.resolve(new Response(
        JSON.stringify({ token: 'testomat_granted', user_id: 42 }),
        { headers: { 'Content-Type': 'application/json' } }
      ));
    }
    return realFetch(input, init);
  });
}

async function listTools(resource, token) {
  return SELF.fetch(resource, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
  });
}

async function refreshGrant(client, refreshToken, resource) {
  const response = await SELF.fetch('https://mcp.testomat.test/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: client.client_id,
      refresh_token: refreshToken,
      resource,
    }),
  });
  expect(response.status).toBe(200);
  return response.json();
}

describe('concurrent project OAuth grants', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps an earlier project grant usable after the same client authorizes another project', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const first = await authorizeGrant(client, MCP_RESOURCE);
    const otherResource = 'https://mcp.testomat.test/mcp/other-project';
    const second = await authorizeGrant(client, otherResource);

    expect((await listTools(MCP_RESOURCE, first.access_token)).status).toBe(200);
    expect((await listTools(otherResource, second.access_token)).status).toBe(200);

    const refresh = await SELF.fetch('https://mcp.testomat.test/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: client.client_id,
        refresh_token: first.refresh_token,
        resource: MCP_RESOURCE,
      }),
    });
    expect(refresh.status).toBe(200);
    const refreshed = await refresh.json();
    expect((await listTools(MCP_RESOURCE, refreshed.access_token)).status).toBe(200);
    expect((await listTools(otherResource, second.access_token)).status).toBe(200);
  });

  it('replaces an earlier grant for the same project without revoking another project', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const first = await authorizeGrant(client, MCP_RESOURCE);
    const otherResource = 'https://mcp.testomat.test/mcp/other-project';
    const other = await authorizeGrant(client, otherResource);
    const replacement = await authorizeGrant(client, MCP_RESOURCE);

    expect((await listTools(MCP_RESOURCE, first.access_token)).status).toBe(401);
    expect((await listTools(MCP_RESOURCE, replacement.access_token)).status).toBe(200);
    expect((await listTools(otherResource, other.access_token)).status).toBe(200);
  });

  it('replaces a native client grant when its loopback callback port changes', async () => {
    stubConsentExchange();
    const client = await registerClient('http://127.0.0.1/callback');
    const first = await authorizeGrant(client, MCP_RESOURCE, 'http://127.0.0.1:3001/callback');
    expect((await listTools(MCP_RESOURCE, first.access_token)).status).toBe(200);
    const replacement = await authorizeGrant(client, MCP_RESOURCE, 'http://127.0.0.1:3002/callback');

    expect((await listTools(MCP_RESOURCE, first.access_token)).status).toBe(401);
    expect((await listTools(MCP_RESOURCE, replacement.access_token)).status).toBe(200);
  });

  it('keeps concurrent grants bound to their own project resources', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const first = await authorizeGrant(client, MCP_RESOURCE);
    const otherResource = 'https://mcp.testomat.test/mcp/other-project';
    const second = await authorizeGrant(client, otherResource);

    expect((await listTools(MCP_RESOURCE, first.access_token)).status).toBe(200);
    expect((await listTools(otherResource, second.access_token)).status).toBe(200);
    expect((await listTools(otherResource, first.access_token)).status).toBe(401);
    expect((await listTools(MCP_RESOURCE, second.access_token)).status).toBe(401);
  });

});

describe('account-wide OAuth grants', () => {
  const OTHER_RESOURCE = 'https://mcp.testomat.test/mcp/other-project';

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Grants written before project metadata existed carry only a label.
  async function makeLegacyGrant(clientId, project) {
    const { keys } = await env.OAUTH_KV.list({ prefix: 'grant:42:' });
    for (const { name } of keys) {
      const grant = JSON.parse(await env.OAUTH_KV.get(name));
      if (grant.clientId === clientId && grant.metadata?.project === project) {
        delete grant.metadata.project;
        await env.OAUTH_KV.put(name, JSON.stringify(grant));
        return;
      }
    }
    throw new Error(`no grant for ${project}`);
  }

  it('opens the consent page without a project', async () => {
    const client = await registerClient();
    const authorize = await startAuthorization(client.client_id, ACCOUNT_RESOURCE);

    expect(authorize.status).toBe(302);
    const location = new URL(authorize.headers.get('Location'));
    expect(location.pathname).toBe('/mcp/authorize');
    expect(location.searchParams.has('project')).toBe(false);
  });

  it('accepts an account token at every project URL', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const account = await authorizeGrant(client, ACCOUNT_RESOURCE);

    expect((await listTools(MCP_RESOURCE, account.access_token)).status).toBe(200);
    expect((await listTools(OTHER_RESOURCE, account.access_token)).status).toBe(200);
  });

  it('refreshes an account grant for the account resource', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const account = await authorizeGrant(client, ACCOUNT_RESOURCE);
    const refreshed = await refreshGrant(client, account.refresh_token, ACCOUNT_RESOURCE);

    expect((await listTools(OTHER_RESOURCE, refreshed.access_token)).status).toBe(200);
  });

  it('replaces the client\'s earlier account grant on re-authorization', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const first = await authorizeGrant(client, ACCOUNT_RESOURCE);
    const replacement = await authorizeGrant(client, ACCOUNT_RESOURCE);

    expect((await listTools(MCP_RESOURCE, first.access_token)).status).toBe(401);
    expect((await listTools(MCP_RESOURCE, replacement.access_token)).status).toBe(200);
  });

  it('keeps project grants when the account is re-authorized', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const project = await authorizeGrant(client, MCP_RESOURCE);
    await authorizeGrant(client, ACCOUNT_RESOURCE);
    await authorizeGrant(client, ACCOUNT_RESOURCE);

    expect((await listTools(MCP_RESOURCE, project.access_token)).status).toBe(200);
  });

  it('keeps legacy grants when the account is re-authorized', async () => {
    stubConsentExchange();
    const client = await registerClient();
    const legacy = await authorizeGrant(client, MCP_RESOURCE);
    await makeLegacyGrant(client.client_id, 'demo-project');
    await authorizeGrant(client, ACCOUNT_RESOURCE);
    await authorizeGrant(client, ACCOUNT_RESOURCE);

    expect((await listTools(MCP_RESOURCE, legacy.access_token)).status).toBe(200);
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
      expect(payload.result.tools.length).toBeGreaterThanOrEqual(17);
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
