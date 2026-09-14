import { loadServerConfig } from '../../src/config/load-config.js';

const AUTH_REQUEST_TTL_SECONDS = 600;

function authRequestKey(state) {
  return `mcp_auth_request:${state}`;
}

function randomState() {
  return crypto.randomUUID().replace(/-/g, '');
}

async function handleAuthorize(request, env) {
  const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);

  if (!oauthReqInfo.clientId) {
    return new Response('Invalid authorization request', { status: 400 });
  }

  const state = randomState();
  await env.OAUTH_KV.put(authRequestKey(state), JSON.stringify(oauthReqInfo), {
    expirationTtl: AUTH_REQUEST_TTL_SECONDS,
  });

  const { baseUrl } = loadServerConfig({}, env);
  const redirect = new URL('/mcp/authorize', `${baseUrl}/`);
  redirect.searchParams.set('state', state);

  return Response.redirect(redirect.toString(), 302);
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 });
  }

  const stored = await env.OAUTH_KV.get(authRequestKey(state));
  if (!stored) {
    return new Response('Authorization request expired', { status: 400 });
  }

  await env.OAUTH_KV.delete(authRequestKey(state));
  const oauthReqInfo = JSON.parse(stored);

  const { baseUrl } = loadServerConfig({}, env);
  const exchange = await fetch(new URL('/mcp/authorize/exchange', `${baseUrl}/`).toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Mcp-Worker-Secret': env.TESTOMATIO_MCP_WORKER_SECRET,
    },
    body: JSON.stringify({ code }),
  });

  if (!exchange.ok) {
    return new Response('Authorization code exchange failed', { status: 502 });
  }

  const payload = await exchange.json();
  if (!payload.token || !payload.user_id) {
    return new Response('Authorization code exchange returned no token', { status: 502 });
  }

  const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId: String(payload.user_id),
    metadata: { label: payload.user_email || String(payload.user_id) },
    scope: oauthReqInfo.scope,
    props: { testomatioToken: payload.token },
  });

  return Response.redirect(redirectTo, 302);
}

export const TestomatioHandler = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/authorize') {
      return handleAuthorize(request, env);
    }

    if (pathname === '/callback') {
      return handleCallback(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};
