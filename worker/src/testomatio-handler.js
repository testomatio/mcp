import { WorkerEntrypoint } from 'cloudflare:workers';
import { loadServerConfig } from '../../src/config/load-config.js';
import { decodePathParameter } from '../../src/core/path-segment.js';

const AUTH_REQUEST_TTL_SECONDS = 600;
const RESOURCE_PATH = /^\/mcp\/([^/]+)\/?$/;

export class TestomatioAuthHandler extends WorkerEntrypoint {
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname === '/authorize') {
      return this.#authorize(request);
    }

    if (pathname === '/callback') {
      return this.#callback(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  async #authorize(request) {
    const oauthReqInfo = await this.env.OAUTH_PROVIDER.parseAuthRequest(request);

    if (!oauthReqInfo.clientId) {
      return new Response('Invalid authorization request', { status: 400 });
    }

    const state = this.#randomState();
    await this.env.OAUTH_KV.put(this.#authRequestKey(state), JSON.stringify(oauthReqInfo), {
      expirationTtl: AUTH_REQUEST_TTL_SECONDS,
    });

    const client = await this.env.OAUTH_PROVIDER.lookupClient(oauthReqInfo.clientId).catch(() => null);
    const project = this.#projectFromResource(oauthReqInfo.resource, request);
    if (!project) {
      return new Response('Authorization resource must identify one project on this server', {
        status: 400,
      });
    }

    const redirect = new URL('/mcp/authorize', `${this.#baseUrl()}/`);

    redirect.searchParams.set('state', state);

    if (client?.clientName) {
      redirect.searchParams.set('client_name', client.clientName);
    }

    redirect.searchParams.set('project', project);

    return Response.redirect(redirect.toString(), 302);
  }

  async #callback(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 });
    }

    const stored = await this.env.OAUTH_KV.get(this.#authRequestKey(state));
    if (!stored) {
      return new Response('Authorization request expired', { status: 400 });
    }

    await this.env.OAUTH_KV.delete(this.#authRequestKey(state));

    const payload = await this.#exchange(code);
    if (!payload) {
      return new Response('Authorization code exchange failed', { status: 502 });
    }

    if (!payload.token || !payload.user_id) {
      return new Response('Authorization code exchange returned no token', { status: 502 });
    }

    const oauthReqInfo = JSON.parse(stored);
    const { redirectTo } = await this.env.OAUTH_PROVIDER.completeAuthorization({
      request: oauthReqInfo,
      userId: String(payload.user_id),
      metadata: { label: payload.user_email || String(payload.user_id) },
      scope: oauthReqInfo.scope,
      props: { testomatioToken: payload.token },
    });

    return Response.redirect(redirectTo, 302);
  }

  async #exchange(code) {
    const response = await fetch(new URL('/mcp/authorize/exchange', `${this.#baseUrl()}/`).toString(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Mcp-Worker-Secret': this.env.TESTOMATIO_MCP_WORKER_SECRET,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  #baseUrl() {
    return loadServerConfig({}, this.env).baseUrl;
  }

  #authRequestKey(state) {
    return `mcp_auth_request:${state}`;
  }

  #randomState() {
    return crypto.randomUUID().replace(/-/g, '');
  }

  #projectFromResource(resource, request) {
    if (!resource || Array.isArray(resource)) {
      return '';
    }

    try {
      const resourceUrl = new URL(String(resource));
      const requestUrl = new URL(request.url);
      if (resourceUrl.origin !== requestUrl.origin || resourceUrl.search || resourceUrl.hash) {
        return '';
      }

      const match = RESOURCE_PATH.exec(resourceUrl.pathname);
      return match ? decodePathParameter(match[1], 'Project ID') : '';
    } catch {
      return '';
    }
  }
}
