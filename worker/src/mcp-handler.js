import { WorkerEntrypoint } from 'cloudflare:workers';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker';
import { loadServerConfig } from '../../src/config/load-config.js';
import { createMcpServer } from '../../src/mcp/create-server.js';
import { createLogger } from '../../src/core/logger.js';
import { decodePathParameter } from '../../src/core/path-segment.js';
import pkg from '../../package.json';

const PROJECT_PATH = /^\/mcp\/([^/]+)\/?$/;
const BEARER = /^Bearer\s+(.+)$/i;
const STATIC_TOKEN_PREFIXES = ['testomat_', 'tstmt_'];
const REAUTH_CODES = ['token_invalid', 'authorization_missing'];

export class McpHandler extends WorkerEntrypoint {
  static bearerToken(request) {
    const match = BEARER.exec((request.headers.get('Authorization') || '').trim());
    return match ? match[1].trim() : '';
  }

  static isStaticToken(token) {
    return STATIC_TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix));
  }

  static projectId(pathname) {
    const match = PROJECT_PATH.exec(pathname);
    return match ? decodePathParameter(match[1], 'Project ID') : '';
  }

  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
    }

    const projectId = McpHandler.projectId(new URL(request.url).pathname);
    if (!projectId) {
      return this.#jsonRpcError(404, -32601, 'Expected POST /mcp/<project_id>');
    }

    const token = this.#token(request);
    if (!token) {
      return this.#unauthorized(request, 'Missing Testomat.io token');
    }

    const response = await this.#dispatch(request, projectId, token);
    return this.#mapRevokedToken(request, response);
  }

  #token(request) {
    return this.ctx?.props?.testomatioToken || McpHandler.bearerToken(request);
  }

  async #dispatch(request, projectId, token) {
    const { baseUrl } = loadServerConfig({}, this.env);
    const server = createMcpServer({
      token,
      projectId,
      baseUrl,
      logger: createLogger(this.env.LOG_LEVEL || 'info'),
      version: pkg.version,
      jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
    });

    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    try {
      await server.connect(transport);
      return await transport.handleRequest(request);
    } finally {
      await server.close();
    }
  }

  async #mapRevokedToken(request, response) {
    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      return response;
    }

    const payload = await response.clone().json().catch(() => null);
    if (!payload || !this.#needsReauthorization(payload)) {
      return response;
    }

    return this.#unauthorized(request, 'Testomat.io rejected this token');
  }

  #needsReauthorization(payload) {
    const results = Array.isArray(payload) ? payload : [payload];

    return results.some((entry) => {
      const content = entry?.result?.content;
      if (!Array.isArray(content)) {
        return false;
      }

      return content.some((item) => this.#isRevokedTokenText(item));
    });
  }

  #isRevokedTokenText(item) {
    if (item?.type !== 'text' || typeof item.text !== 'string') {
      return false;
    }

    try {
      const parsed = JSON.parse(item.text);
      return parsed.status === 403 && REAUTH_CODES.includes(parsed.details?.code);
    } catch {
      return false;
    }
  }

  #unauthorized(request, description) {
    const url = new URL(request.url);
    const resourceMetadata = `${url.origin}/.well-known/oauth-protected-resource${url.pathname}`;

    return this.#jsonRpcError(401, -32001, description, {
      'WWW-Authenticate': `Bearer realm="OAuth", resource_metadata="${resourceMetadata}", error="invalid_token", error_description="${description}"`,
    });
  }

  #jsonRpcError(status, code, message, headers = {}) {
    return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }
}
