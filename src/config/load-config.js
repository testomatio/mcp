import { DEFAULT_BASE_URL, DEFAULT_PROFILE, TOOL_PROFILES } from './constants.js';
import { ConfigurationError } from '../core/errors.js';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBaseUrl(value) {
  const normalized = normalizeString(value);
  return normalized.replace(/\/+$/, '');
}

export function loadConfig(argvOptions = {}) {
  const token = normalizeString(
    argvOptions.token || process.env.TESTOMATIO_PROJECT_TOKEN || process.env.TESTOMATIO_API_TOKEN
  );
  const projectId = normalizeString(argvOptions.project || process.env.TESTOMATIO_PROJECT_ID);
  const baseUrl = normalizeBaseUrl(argvOptions.baseUrl || process.env.TESTOMATIO_BASE_URL || DEFAULT_BASE_URL);
  const rawToolsProfile = normalizeString(argvOptions.tools || process.env.TESTOMATIO_TOOLS).toLowerCase();
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
