import { DEFAULT_BASE_URL, DEFAULT_PROFILE, TOOL_PROFILES } from './constants.js';
import { ConfigurationError } from '../core/errors.js';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBaseUrl(value) {
  const normalized = normalizeString(value);
  return normalized.replace(/\/+$/, '');
}

function hostToBaseUrl(value) {
  const host = normalizeBaseUrl(value);

  if (!host) {
    return '';
  }

  return /^https?:\/\//i.test(host) ? host : `https://${host}`;
}

export function resolveBaseUrl(argvOptions = {}, env = process.env) {
  const explicitBaseUrl = normalizeBaseUrl(argvOptions.baseUrl || env.TESTOMATIO_BASE_URL);
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const hostBaseUrl = hostToBaseUrl(argvOptions.host || env.TESTOMATIO_HOST);
  if (hostBaseUrl) {
    return hostBaseUrl;
  }

  return DEFAULT_BASE_URL;
}

export function loadServerConfig(argvOptions = {}, env = process.env) {
  return {
    baseUrl: resolveBaseUrl(argvOptions, env),
  };
}

export function loadConfig(argvOptions = {}, env = process.env) {
  const token = normalizeString(
    argvOptions.token || env.TESTOMATIO_PROJECT_TOKEN || env.TESTOMATIO_API_TOKEN
  );
  const projectId = normalizeString(argvOptions.project || env.TESTOMATIO_PROJECT_ID);
  const baseUrl = resolveBaseUrl(argvOptions, env);
  const rawToolsProfile = normalizeString(argvOptions.tools || env.TESTOMATIO_TOOLS).toLowerCase();
  const toolsProfile = rawToolsProfile || DEFAULT_PROFILE;

  if (!token) {
    throw new ConfigurationError(
      'Project token is required. Use --token <token> or set TESTOMATIO_PROJECT_TOKEN (or TESTOMATIO_API_TOKEN).'
    );
  }

  if (!projectId) {
    throw new ConfigurationError(
      'Project ID is required. Use --project <project_id> or set TESTOMATIO_PROJECT_ID'
    );
  }

  if (!TOOL_PROFILES.includes(toolsProfile)) {
    throw new ConfigurationError(
      `Unknown tools profile "${toolsProfile}". Use one of: ${TOOL_PROFILES.join(', ')}.`
    );
  }

  return {
    token,
    projectId,
    baseUrl,
    toolsProfile,
  };
}
