async function loadCoreModule() {
  try {
    const installedCore = await import('@testomatio/mcp');
    if (
      installedCore &&
      typeof installedCore.createApplication === 'function' &&
      installedCore.ConfigurationError &&
      Array.isArray(installedCore.TOOL_DEFINITIONS)
    ) {
      return installedCore;
    }
  } catch {
    // Fall back to the local repo copy when testing from a checkout.
  }

  return import('../../../src/index.js');
}

const coreModule = await loadCoreModule();

export const {
  ANALYTICS_STATS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_STATS_TQL_REFERENCE,
  ANALYTICS_TESTS_TQL_INPUT_DESCRIPTION,
  ANALYTICS_TESTS_TQL_REFERENCE,
  ConfigurationError,
  TOOL_DEFINITIONS,
  createApplication,
} = coreModule;
