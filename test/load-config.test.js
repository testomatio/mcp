import { describe, expect, it } from 'vitest';
import { loadConfig, loadServerConfig, resolveBaseUrl } from '../src/config/load-config.js';
import { DEFAULT_BASE_URL } from '../src/config/constants.js';

describe('resolveBaseUrl', () => {
  it('falls back to the default base url', () => {
    expect(resolveBaseUrl({}, {})).toBe(DEFAULT_BASE_URL);
  });

  it('expands a bare host to https', () => {
    expect(resolveBaseUrl({ host: 'beta.testomat.io' }, {})).toBe('https://beta.testomat.io');
    expect(resolveBaseUrl({}, { TESTOMATIO_HOST: 'beta.testomat.io' })).toBe('https://beta.testomat.io');
  });

  it('accepts a full url passed as host', () => {
    expect(resolveBaseUrl({ host: 'https://beta.testomat.io' }, {})).toBe('https://beta.testomat.io');
    expect(resolveBaseUrl({ host: 'http://localhost:3000/' }, {})).toBe('http://localhost:3000');
  });

  it('prefers an explicit base url over host', () => {
    expect(resolveBaseUrl({ baseUrl: 'https://app.testomat.io', host: 'beta.testomat.io' }, {})).toBe(
      'https://app.testomat.io'
    );
    expect(
      resolveBaseUrl({}, { TESTOMATIO_BASE_URL: 'https://app.testomat.io', TESTOMATIO_HOST: 'beta.testomat.io' })
    ).toBe('https://app.testomat.io');
  });

  it('prefers cli options over environment', () => {
    expect(resolveBaseUrl({ host: 'cli.testomat.io' }, { TESTOMATIO_HOST: 'env.testomat.io' })).toBe(
      'https://cli.testomat.io'
    );
  });

  it('strips trailing slashes', () => {
    expect(resolveBaseUrl({ baseUrl: 'https://app.testomat.io///' }, {})).toBe('https://app.testomat.io');
  });
});

describe('loadServerConfig', () => {
  it('returns only the base url and never throws without credentials', () => {
    expect(loadServerConfig({}, {})).toEqual({ baseUrl: DEFAULT_BASE_URL });
    expect(loadServerConfig({}, { TESTOMATIO_HOST: 'beta.testomat.io' })).toEqual({
      baseUrl: 'https://beta.testomat.io',
    });
  });
});

describe('loadConfig', () => {
  it('requires a token', () => {
    expect(() => loadConfig({}, {})).toThrow(/Project token is required/);
  });

  it('requires a project id', () => {
    expect(() => loadConfig({ token: 'tstmt_x' }, {})).toThrow(/Project ID is required/);
  });

  it('reads credentials from the environment', () => {
    expect(
      loadConfig({}, { TESTOMATIO_PROJECT_TOKEN: 'tstmt_x', TESTOMATIO_PROJECT_ID: 'demo' })
    ).toEqual({ token: 'tstmt_x', projectId: 'demo', baseUrl: DEFAULT_BASE_URL });
  });

  it('supports the legacy api token variable', () => {
    expect(
      loadConfig({}, { TESTOMATIO_API_TOKEN: 'tstmt_legacy', TESTOMATIO_PROJECT_ID: 'demo' }).token
    ).toBe('tstmt_legacy');
  });
});
