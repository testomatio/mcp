import { HttpClient } from './http-client.js';

export class TestomatioApiClient {
  constructor({ baseUrl, projectId, token, logger }) {
    this.projectId = projectId;
    this.logger = logger;
    this.sessionHash = null;
    this.sessionPromise = null;
    this.http = new HttpClient({
      baseUrl,
      token,
      logger,
    });
  }

  buildPath(resource, id = '') {
    const safeResource = String(resource).replace(/^\/+|\/+$/g, '');
    const safeId = id ? `/${String(id).replace(/^\/+|\/+$/g, '')}` : '';
    return `/api/v2/${this.projectId}/${safeResource}${safeId}`;
  }

  list(resource, query = {}) {
    return this.http.request('GET', this.buildPath(resource), { query });
  }

  get(resource, id, query = {}) {
    return this.http.request('GET', this.buildPath(resource, id), { query });
  }

  async create(resource, body = {}) {
    return this.mutate('POST', this.buildPath(resource), { body });
  }

  async createMultipart(resource, formData) {
    return this.mutate('POST', this.buildPath(resource), { body: formData });
  }

  async createWithQuery(resource, { query = {}, body = {} } = {}) {
    return this.mutate('POST', this.buildPath(resource), { query, body });
  }

  async update(resource, id, body = {}) {
    return this.mutate('PUT', this.buildPath(resource, id), { body });
  }

  async patch(resource, id, body = {}) {
    return this.mutate('PATCH', this.buildPath(resource, id), { body });
  }

  async patchMultipart(resource, id, formData) {
    return this.mutate('PATCH', this.buildPath(resource, id), { body: formData });
  }

  async delete(resource, id, query = {}) {
    return this.mutate('DELETE', this.buildPath(resource, id), { query });
  }

  search(resource, query = {}) {
    return this.list(resource, query);
  }

  async mutate(method, path, options = {}) {
    const runRequest = async () => {
      const sessionHash = await this.ensureSession();
      return this.http.request(method, path, {
        ...options,
        headers: {
          ...options.headers,
          'X-Session-Hash': sessionHash,
        },
      });
    };

    try {
      return await runRequest();
    } catch (error) {
      if (!this.shouldRefreshSession(error)) {
        throw error;
      }

      await this.refreshSession();
      return runRequest();
    }
  }

  async ensureSession() {
    if (this.sessionHash) {
      return this.sessionHash;
    }

    if (!this.sessionPromise) {
      this.sessionPromise = this.startSession().finally(() => {
        this.sessionPromise = null;
      });
    }

    return this.sessionPromise;
  }

  async startSession() {
    const response = await this.http.request('POST', this.buildPath('sessions'), {
      body: { description: 'MCP session' },
    });
    const sessionHash = response?.data?.hash || response?.hash;

    if (!sessionHash) {
      throw new Error('Failed to start Testomat.io API session: missing session hash');
    }

    this.sessionHash = sessionHash;
    return sessionHash;
  }

  async stopSession() {
    if (this.sessionPromise) {
      try {
        await this.sessionPromise;
      } catch {
        return;
      }
    }

    if (!this.sessionHash) {
      return;
    }

    const sessionHash = this.sessionHash;
    this.sessionHash = null;

    try {
      await this.http.request('DELETE', this.buildPath('sessions', sessionHash));
    } catch (error) {
      if (error?.status !== 404) {
        this.logger?.error('Failed to stop Testomat.io API session', {
          error: error?.message || error,
        });
      }
    }
  }

  shouldRefreshSession(error) {
    return error?.status === 403 && Boolean(this.sessionHash);
  }

  async refreshSession() {
    this.sessionHash = null;
    return this.ensureSession();
  }
}
