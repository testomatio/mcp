import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker';
import { loadServerConfig } from '../../src/config/load-config.js';
import { createMcpServer } from '../../src/mcp/create-server.js';
import { createLogger } from '../../src/core/logger.js';
import pkg from '../../package.json';

const PROJECT_PATH = /^\/mcp\/([^/]+)\/?$/;

export function parseProjectId(pathname) {
  const match = PROJECT_PATH.exec(pathname);
  return match ? decodeURIComponent(match[1]) : '';
}

function jsonRpcError(status, code, message, headers = {}) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function unauthorizedResponse(request, description) {
  const url = new URL(request.url);
  const resourceMetadata = `${url.origin}/.well-known/oauth-protected-resource${url.pathname}`;

  return jsonRpcError(401, -32001, description, {
    'WWW-Authenticate': `Bearer realm="OAuth", resource_metadata="${resourceMetadata}", error="invalid_token", error_description="${description}"`,
  });
}

function isForbiddenToolResult(payload) {
  const results = Array.isArray(payload) ? payload : [payload];

  return results.some((entry) => {
    const content = entry?.result?.content;
    if (!Array.isArray(content)) {
      return false;
    }

    return content.some((item) => {
      if (item?.type !== 'text' || typeof item.text !== 'string') {
        return false;
      }

      try {
        return JSON.parse(item.text).status === 403;
      } catch {
        return false;
      }
    });
  });
}

async function mapRevokedToken(request, response) {
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    return response;
  }

  const payload = await response.clone().json().catch(() => null);
  if (!payload || !isForbiddenToolResult(payload)) {
    return response;
  }

  return unauthorizedResponse(request, 'Testomat.io rejected this token');
}

export async function handleMcpRequest(request, { token, env }) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  const projectId = parseProjectId(url.pathname);
  if (!projectId) {
    return jsonRpcError(404, -32601, 'Expected POST /mcp/<project_id>');
  }

  if (!token) {
    return unauthorizedResponse(request, 'Missing Testomat.io token');
  }

  const { baseUrl } = loadServerConfig({}, env);
  const server = createMcpServer({
    token,
    projectId,
    baseUrl,
    logger: createLogger(env.LOG_LEVEL || 'info'),
    version: pkg.version,
    jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
  });

  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  await server.connect(transport);

  const response = await transport.handleRequest(request);
  return mapRevokedToken(request, response);
}
