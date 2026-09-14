import OAuthProvider from '@cloudflare/workers-oauth-provider';
import { handleMcpRequest } from './mcp-handler.js';
import { TestomatioHandler } from './testomatio-handler.js';

const STATIC_TOKEN_PREFIXES = ['testomat_', 'tstmt_'];

function bearerToken(request) {
  const match = /^Bearer\s+(.+)$/i.exec((request.headers.get('Authorization') || '').trim());
  return match ? match[1].trim() : '';
}

function isStaticToken(token) {
  return STATIC_TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix));
}

const McpApiHandler = {
  async fetch(request, env, ctx) {
    return handleMcpRequest(request, {
      token: ctx?.props?.testomatioToken || bearerToken(request),
      env,
    });
  },
};

const oauthProvider = new OAuthProvider({
  apiRoute: '/mcp',
  apiHandler: McpApiHandler,
  defaultHandler: TestomatioHandler,
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
});

export default {
  async fetch(request, env, ctx) {
    const token = bearerToken(request);

    if (isStaticToken(token) && new URL(request.url).pathname.startsWith('/mcp')) {
      return McpApiHandler.fetch(request, env, ctx);
    }

    return oauthProvider.fetch(request, env, ctx);
  },
};
