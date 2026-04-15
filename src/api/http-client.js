import { ApiError } from '../core/errors.js';

function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(path, `${baseUrl}/`);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.append(key, String(value));
  });

  return url.toString();
}

export class HttpClient {
  constructor({ baseUrl, token, logger }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.logger = logger;
  }

  async request(method, path, { query, body, headers: requestHeaders = {} } = {}) {
    const url = buildUrl(this.baseUrl, path, query);

    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...requestHeaders,
    };

    const options = {
      method,
      headers,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    this.logger.debug('HTTP request', { method, url });
    const response = await fetch(url, options);
    const text = await response.text();

    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, {
        status: response.status,
        url,
        payload,
      });
    }

    return payload;
  }
}
