import { WorkerEntrypoint } from 'cloudflare:workers';
import OAuthProvider from '@cloudflare/workers-oauth-provider';
import { McpHandler } from './mcp-handler.js';
import { TestomatioAuthHandler } from './testomatio-handler.js';

const oauthProvider = new OAuthProvider({
  apiRoute: '/mcp',
  apiHandler: McpHandler,
  defaultHandler: TestomatioAuthHandler,
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
});

export default class TestomatioMcpWorker extends WorkerEntrypoint {
  async fetch(request) {
    if (this.#usesStaticToken(request)) {
      return new McpHandler(this.ctx, this.env).fetch(request);
    }

    return oauthProvider.fetch(request, this.env, this.ctx);
  }

  #usesStaticToken(request) {
    const token = McpHandler.bearerToken(request);
    if (!McpHandler.isStaticToken(token)) {
      return false;
    }

    return new URL(request.url).pathname.startsWith('/mcp');
  }
}
