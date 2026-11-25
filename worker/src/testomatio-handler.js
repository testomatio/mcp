import { WorkerEntrypoint } from 'cloudflare:workers';
import { loadServerConfig } from '../../src/config/load-config.js';
import { decodePathParameter } from '../../src/core/path-segment.js';

const AUTH_REQUEST_TTL_SECONDS = 600;
const RESOURCE_PATH = /^\/mcp\/([^/]+)\/?$/;
// The provider matches audiences by path prefix, so a grant for `/mcp` is accepted at
// every `/mcp/<project_id>` URL. A trailing slash would match none of them.
const ACCOUNT_RESOURCE_PATH = '/mcp';
const INVALID_RESOURCE_MESSAGE =
  'Authorization resource must be this server\'s /mcp endpoint or identify one project on it';

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
    const target = this.#grantTarget(oauthReqInfo.resource, request);
    if (!target) {
      return new Response(INVALID_RESOURCE_MESSAGE, { status: 400 });
    }

    const redirect = new URL('/mcp/authorize', `${this.#baseUrl()}/`);

    redirect.searchParams.set('state', state);

    if (client?.clientName) {
      redirect.searchParams.set('client_name', client.clientName);
    }

    if (target.project) {
      redirect.searchParams.set('project', target.project);
    }

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
    const target = this.#grantTarget(oauthReqInfo.resource, request);
    if (!target) {
      return new Response(INVALID_RESOURCE_MESSAGE, { status: 400 });
    }

    // Capture older matching grants before creating the replacement, so a failed
    // authorization never revokes a working grant or matches its own new grant.
    const previousGrants = [];
    // Metadata-document client IDs are shared across installations; only those
    // clients scope replacement by redirect URI, matching the provider library.
    const isMetadataClient = this.#isMetadataClientId(oauthReqInfo.clientId);
    let cursor;
    do {
      const page = await this.env.OAUTH_PROVIDER.listUserGrants(String(payload.user_id), { cursor });
      previousGrants.push(...page.items.filter((grant) =>
        grant.clientId === oauthReqInfo.clientId &&
        (!isMetadataClient || grant.redirectUri === oauthReqInfo.redirectUri) &&
        this.#sameTarget(grant.metadata, target)
      ));
      cursor = page.cursor;
    } while (cursor);

    const { redirectTo } = await this.env.OAUTH_PROVIDER.completeAuthorization({
      request: oauthReqInfo,
      userId: String(payload.user_id),
      metadata: { label: payload.user_email || String(payload.user_id), ...target },
      scope: oauthReqInfo.scope,
      props: { testomatioToken: payload.token },
      // One client can hold an account grant and several project grants; each grant
      // remains bound to its own resource.
      revokeExistingGrants: false,
    });

    await Promise.all(previousGrants.map((grant) =>
      this.env.OAUTH_PROVIDER.revokeGrant(grant.id, String(payload.user_id))
    ));
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

  // Mirrors the provider library's isClientMetadataUrl: an HTTPS client ID
  // with a non-root path identifies a client metadata document registration.
  #isMetadataClientId(clientId) {
    try {
      const url = new URL(String(clientId));
      return url.protocol === 'https:' && url.pathname !== '/';
    } catch {
      return false;
    }
  }

  #grantTarget(resource, request) {
    if (!resource || Array.isArray(resource)) {
      return null;
    }

    try {
      const resourceUrl = new URL(String(resource));
      const requestUrl = new URL(request.url);
      // `href` keeps an empty `?` or `#`, which `search` and `hash` report as empty.
      if (resourceUrl.href === new URL(ACCOUNT_RESOURCE_PATH, requestUrl.origin).href) {
        return { account: true };
      }

      if (resourceUrl.origin !== requestUrl.origin || resourceUrl.search || resourceUrl.hash) {
        return null;
      }

      const match = RESOURCE_PATH.exec(resourceUrl.pathname);
      const project = match ? decodePathParameter(match[1], 'Project ID') : '';
      return project ? { project } : null;
    } catch {
      return null;
    }
  }

  // Legacy grants carry neither `account` nor `project`, so no re-authorization replaces them.
  #sameTarget(metadata, target) {
    return target.account ? metadata?.account === true : metadata?.project === target.project;
  }
}
