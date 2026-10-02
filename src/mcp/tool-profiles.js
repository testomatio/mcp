import { ENTITY_TOOL_SPECS } from './tool-definitions.js';
import { buildEntityTool } from './definitions/entity-tool.js';
import { READ_ONLY_COMMANDS } from './entity-commands.js';

const RARE_ENTITIES = new Set(['steps', 'snippets', 'labels', 'rungroups']);

const SPEC_BY_NAME = new Map(ENTITY_TOOL_SPECS.map((spec) => [spec.name, spec]));

function restrictSpecToReadOnly(spec) {
  const commands = Object.fromEntries(
    Object.entries(spec.commands).filter(([command]) => READ_ONLY_COMMANDS.has(command))
  );
  const params = Object.fromEntries(
    Object.entries(spec.params)
      .map(([key, param]) => [
        key,
        { ...param, commands: param.commands.filter((command) => READ_ONLY_COMMANDS.has(command)) },
      ])
      .filter(([, param]) => param.commands.length > 0)
  );
  return { ...spec, commands, params };
}

function shapeToolForProfile(tool, profile) {
  if (!tool || !tool.name) return tool;
  if (RARE_ENTITIES.has(tool.name)) return undefined;
  if (profile === 'core') return tool;

  const spec = SPEC_BY_NAME.get(tool.name);
  if (!spec) return tool;
  return buildEntityTool(restrictSpecToReadOnly(spec));
}

/**
 * Select tools for a profile. Unknown profiles fall back to full.
 *
 * @param {Array} allTools
 * @param {string} profile  'full' | 'core' | 'read'
 */
export function selectTools(allTools, profile) {
  if (!profile || profile === 'full') return allTools;
  return allTools.map((tool) => shapeToolForProfile(tool, profile)).filter(Boolean);
}
