import { HttpClient } from './http-client.js';

export class TestomatioApiClient {
  constructor({ baseUrl, projectId, token, logger, useSystemCa = false }) {
    this.projectId = projectId;
    this.http = new HttpClient({
      baseUrl,
      token,
      logger,
      useSystemCa,
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

  create(resource, body = {}) {
    return this.http.request('POST', this.buildPath(resource), { body });
  }

  createWithQuery(resource, { query = {}, body = {} } = {}) {
    return this.http.request('POST', this.buildPath(resource), { query, body });
  }

  update(resource, id, body = {}) {
    return this.http.request('PUT', this.buildPath(resource, id), { body });
  }

  delete(resource, id, query = {}) {
    return this.http.request('DELETE', this.buildPath(resource, id), { query });
  }

  search(resource, query = {}) {
    return this.list(resource, query);
  }
}
