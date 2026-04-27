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
  ConfigurationError,
  TOOL_DEFINITIONS,
  createApplication,
} = coreModule;
