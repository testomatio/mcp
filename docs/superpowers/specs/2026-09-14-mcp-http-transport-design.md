# HTTP Transport for the Testomat.io MCP Server

**Issue:** [testomatio/mcp#4](https://github.com/testomatio/mcp/issues/4)
**Date:** 2026-09-14
**Status:** Approved design, ready for implementation planning

## Problem

The MCP server speaks stdio only. It must be launched as a local subprocess with a
token and project baked into the process, which rules out remote integrations,
distributed environments, and web-based MCP clients.

Two client families must be able to connect:

- **IDE clients** (Claude Code, Cursor, VS Code, Windsurf) — accept a static
  `Authorization` header.
- **Web connectors** (claude.ai, ChatGPT) — have nowhere to put a static token
  and require OAuth 2.1 with PKCE and Dynamic Client Registration.

The second family is what forces an authorization server into the design.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Hosting | Testomat.io-hosted only, on Cloudflare Workers | One endpoint to secure. Self-hosted users keep stdio. |
| Endpoint | `https://mcp.testomat.io/mcp/<project_id>` | Project in the URL leaves every tool signature unchanged. |
| Transport | Stateless `WebStandardStreamableHTTPServerTransport` | Tools-only server has no session state. No Durable Objects. |
| Authorization server | Cloudflare Worker, via `@cloudflare/workers-oauth-provider` | Spec churn (DCR, metadata, PKCE) stays where deploys cost seconds. |
| Identity + consent | Rails, reusing the existing sign-in and consent patterns | Real "Sign in with Testomat.io", not a paste-a-token box. |
| Authorization of data | Unchanged — `Api::V2::BaseController` | The Worker decides nothing. See Security. |

### Why not a Doorkeeper OAuth server in Rails

Doorkeeper ships no Dynamic Client Registration, so it would have to be written by
hand, and every MCP spec revision would become a Rails deploy. Rejected as weeks of
work for no benefit to this feature. If Testomat.io later wants a general public
OAuth API, that is a separate project, and the Rails endpoint added here is small
enough to throw away.

### Why not serve MCP from Rails directly

It would save a network hop, but it means implementing MCP and OAuth 2.1 in Ruby
with no mature gem, plus SSE at scale on Puma.

## Verified facts

These were checked against installed packages, not recalled. They are the load-bearing
assumptions of the design.

- `@modelcontextprotocol/sdk@1.30.0` ships
  `WebStandardStreamableHTTPServerTransport` with
  `handleRequest(req: Request): Promise<Response>`, documented as running on
  Cloudflare Workers. Omitting `sessionIdGenerator` selects stateless mode;
  `enableJsonResponse: true` removes SSE plumbing entirely.
- `Server` + `setRequestHandler(schema, handler)` survives the 0.4 → 1.30 jump
  unchanged, so `src/mcp/server.js` needs only its transport swapped.
- **Gotcha:** `server/index.js` statically imports `AjvJsonSchemaValidator`. Ajv
  compiles schemas with `new Function`, which Workers forbid. Pass
  `jsonSchemaValidator: new CfWorkerJsonSchemaValidator()` (from
  `@modelcontextprotocol/sdk/validation/cfworker`) and add the
  `@cfworker/json-schema` peer dependency.
- **Gotcha:** the SDK depends on `express`, `cors`, and `@hono/node-server`.
  Import deep paths (`/server/index.js`, `/server/webStandardStreamableHttp.js`)
  rather than the barrel so the bundler drops them.
- `@cloudflare/workers-oauth-provider@0.10.3` matches API routes with
  `url.pathname.startsWith(route)`, so the static prefix `/mcp` covers
  `/mcp/<project_id>`. It serves path-scoped
  `/.well-known/oauth-protected-resource/<path>`, returns
  `WWW-Authenticate` with a `resource_metadata` URL on 401, and validates the
  RFC 8707 `resource` parameter hierarchically.
- `Rails.cache` is `:redis_cache_store` in production, so the authorization-code
  handoff needs no migration.
- The `tokens` table already has a `type` column (STI), so `McpToken` needs no
  migration either.

## Architecture

```
testomatio/mcp
├── index.js                       npm bin — stdio, behavior unchanged
├── src/                           SHARED CORE (fetch-only, portable)
│   ├── api/                       TestomatioApiClient — unchanged
│   ├── mcp/                       tool definitions + registry — unchanged
│   └── mcp/create-server.js       NEW — request-scoped factory
└── worker/                        excluded from the npm tarball
    ├── src/index.js               OAuthProvider wiring + bearer bypass
    ├── src/mcp-handler.js         transport per request
    ├── src/testomatio-handler.js  /authorize, /callback
    └── wrangler.jsonc
```

`package.json` already declares `files: ["index.js", "src", "README.md"]`, so
`worker/` stays out of the published package with no change.

### Core refactor

Three blockers, each small:

1. **SDK `^0.4.0` → `^1.30.0`.** No HTTP transport exists before 1.x.
2. **`loadConfig` demands token and project at process start.** Split out
   `loadServerConfig()` returning `baseUrl` only; the CLI path is untouched.
3. **`TestomatioMCPServer.run()` hardcodes `StdioServerTransport`.** Add
   `connect(transport)`; `run()` becomes `connect(new StdioServerTransport())`.

The one new core file:

```js
// src/mcp/create-server.js
export function createMcpServer({ token, projectId, baseUrl, logger }) {
  const config = { token, projectId, baseUrl };
  return new TestomatioMCPServer({
    config,
    apiClient: new TestomatioApiClient({ ...config, logger }),
    logger,
  });
}
```

Nothing inside `TestomatioApiClient` or `ToolRegistry` changes: the client already
takes `{baseUrl, projectId, token}` per instance, and the registry already reads
`this.config.projectId`.

### Request path

```
POST https://mcp.testomat.io/mcp/<project_id>
  │
  ├─ Authorization: Bearer testomat_… / tstmt_…   → direct pass-through
  └─ Authorization: Bearer <oauth token>          → grant lookup → props.testomatioToken
  │
  ▼
createMcpServer({ token, projectId, baseUrl })
  → new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true })
  → handleRequest(request) → Response
  │
  ▼
GET/POST https://app.testomat.io/api/v2/<project_id>/…
Authorization: Bearer <testomat token>
```

A fresh `Server` and transport are built per request and discarded. `GET` on the
endpoint returns 405 — there is no server-initiated traffic to stream.

### Static bearer tokens remain supported

`OAuthProvider` rejects any token it did not issue, which would break IDE clients
after OAuth lands. The Worker's outer `fetch` therefore inspects the token prefix:
`testomat_` or `tstmt_` goes straight to the MCP handler, anything else delegates to
the provider. This keeps `curl` and CI usable and costs a few lines. The backend
still performs all authorization either way.

## OAuth flow

```
1-2.  claude.ai → /.well-known/oauth-protected-resource/mcp/<project>   Worker
                → /.well-known/oauth-authorization-server               Worker
3.    claude.ai → POST /register   (DCR, RFC 7591)                      Worker
4.    browser   → /authorize?client_id&code_challenge&state&resource    Worker
5.    Worker stores oauthReqInfo in OAUTH_KV under a random `state`,
      302 → app.testomat.io/mcp/authorize?state=<random>
6.    Rails: authenticate_user! → consent page → [Authorize]
7.    Rails mints McpToken, stores an opaque code in Rails.cache (60s),
      302 → <configured worker callback>?code=<opaque>&state=<random>
8.    Worker POSTs /mcp/authorize/exchange  (server-to-server,
      X-Mcp-Worker-Secret) → Rails returns the token key, deletes the code
9.    Worker completeAuthorization({ props: { testomatioToken } })
10.   Worker 302 → claude.ai, then POST /token (PKCE) → access + refresh
11.   tool call → props.testomatioToken → Bearer → /api/v2/<project>/…
```

### Why step 7-8 is split

An earlier draft had Rails sign a JWT *containing the API token* and redirect with it
in the query string. That puts a live bearer credential into browser history,
Cloudflare request logs, and any intermediate proxy. Authorization codes exist to
prevent exactly this.

The corrected flow redirects with an **opaque random code** and exchanges it
server-to-server. Concretely:

- Rails stores `mcp_auth_code:<code> → token.encrypted_key` in `Rails.cache` with a
  60-second TTL. Delete-on-read gives single use with no new table.
- The Worker POSTs the code to `/mcp/authorize/exchange` with a shared
  `X-Mcp-Worker-Secret`. Rails returns the key and deletes the cache entry.
- **Rails never accepts a `callback` parameter.** The Worker callback URL is Rails
  configuration. Only `state` round-trips. This removes open-redirect risk entirely.
- The shared secret is dedicated to this flow — it does not reuse the application's
  `JsonWebToken` secret.
- The Worker recovers `oauthReqInfo` at `/callback` from `OAUTH_KV`, keyed by the
  random `state`. The Cloudflare demo base64-encodes it into the URL unsigned and
  warns against shipping that.

## Backend changes

One controller, one view, one route, one model, plus a small migration for usability.

### `McpToken < Token`

STI on the existing `type` column. `Token.active.find_by(encrypted_key:)` in
`Api::V2::BaseController` finds it unchanged, and `is_a?(ProjectToken)` is false, so
it behaves as a general token. **Zero changes to the API authentication path.**

`Token#generate_encrypted_key` labels by `type.to_s.include?('Project')`, so
`McpToken` correctly receives the `testomat_` prefix.

**One token per grant.** Each completed authorization mints a fresh `McpToken` rather
than reusing an existing one, so revoking a single connector cannot disconnect the
others.

### `Mcp::AuthorizationsController`

- `authorize` — consent page, cloned from `app/views/auth/app_auth.html.erb`.
- `create` — mints the `McpToken`, stores the opaque code, redirects back.
- `exchange` — server-to-server code redemption, secret-authenticated, CSRF-exempt.

Use Devise's `authenticate_user!` with `store_location_for`, **not**
`AuthController#require_signed_in_user` — that method is private to `AuthController`
and hardwires `session[:after_sign_in_app_auth]`.

Consent copy must state plainly that the grant covers every project the user belongs
to; the URL selects the project, the token does not restrict it.

### Migration: `tokens.name`, `tokens.last_used_at`

Every grant mints a token. A user with three claude.ai connectors plus Cursor would
otherwise see four indistinguishable `testomat_…` rows and be unable to revoke the
right one. `name` is free at authorize time — the DCR `client_name` ("Claude") plus
the project slug.

### Revocation UI

`user.general_tokens` is scoped `where(type: nil)`, so `McpToken`s are invisible on
the access-tokens page. Add `accounts/_mcp_connectors_table.html.erb`, rendered from
`app/views/accounts/show_access_tokens.erb`, listing name, project, last used, and a
revoke action. That page already has copy-to-clipboard wired up.

### Connect-to-Claude UI

Split by repository, per the backend `CLAUDE.md` rule that project-scoped frontend
lives in a separate repo and must not be developed here.

- **Account page (this repo, SSR):** a project dropdown that builds and copies the
  connector URL, next to the connectors table.
- **Project settings (separate frontend repo):** add `mcp_url` to the project payload
  the settings frontend already consumes, and document how to render the button. Do
  not invent a new endpoint for a value derivable from the slug.

### Observability

Set `User-Agent: testomatio-mcp/<version> (http)` in `HttpClient`.
`RequestStore[:user_agent]` is already captured, and this is the only way MCP traffic
becomes distinguishable from ordinary public API traffic in metrics.

### Documentation

Backend `CLAUDE.md` requires docs for new features → `docs/integrations/mcp-oauth.md`
in the backend repo, covering the flow, the token type, and revocation.

## Security

**The Worker makes no authorization decisions.** This is the property that makes the
design safe to run at the edge:

- `set_project!` resolves the project as
  `@current_user.projects.without_deleted.find_by(slug:)`. A user cannot reach a
  project they do not belong to, whatever URL they paste into a connector.
- Read-only users are rejected by `set_project!`; RBAC write permissions are enforced
  by `authorize_v2_mutation!`. MCP inherits both unchanged.
- Revocation propagates for free: pausing or deleting the `McpToken` makes the
  backend return 403, which the Worker maps to `401` with `WWW-Authenticate` so the
  client transparently re-runs OAuth.
- The Testomat.io token is held only in OAuth grant `props`, which
  `workers-oauth-provider` encrypts at rest in KV.
- No credential ever travels in a URL — see "Why step 7-8 is split".

## Testing

The repository currently has zero tests and zero devDependencies. The 0.4 → 1.30 SDK
jump alone justifies fixing that.

- A `tools/list` snapshot test proving the SDK upgrade is non-breaking. Write it
  **before** the bump, against 0.4.0, so it is a genuine regression test.
- `vitest` + `@cloudflare/vitest-pool-workers` for the Worker.
- One end-to-end test driving `StreamableHTTPClientTransport` against the Worker with
  a stubbed api/v2, asserting `initialize` → `tools/list` → `tools/call`.
- A test that a 403 from the backend becomes a 401 with `WWW-Authenticate`.
- Rails controller tests for consent, redirect, code exchange, code single-use, and
  code expiry.

## Rollout

Four steps, each independently shippable.

1. **SDK bump + core refactor + tests.** No behavior change; stdio users unaffected.
2. **Worker with bearer pass-through, no OAuth.** Deployable and curl-testable.
3. **Rails authorize endpoint + Worker OAuth provider.**
4. **Revocation UI, connect-to-Claude UI, docs.**

**Steps 1-2 close the HTTP-transport half of issue #4 on their own**, so the release
does not block on OAuth review.

## Open items for implementation

- Confirm the exact `/.well-known/oauth-protected-resource` document shape against
  current claude.ai behavior during step 3. The provider serves it path-scoped; that
  it matches what claude.ai expects is verified by connecting, not assumed here.
- Decide whether `mcp.testomat.io` is a Worker route on the existing zone or a
  `workers.dev` subdomain fronted by a custom domain.
