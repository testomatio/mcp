const RARE_ENTITIES = new Set(['steps', 'snippets', 'labels', 'rungroups']);

function entityOf(name) {
  if (name === 'system_ping') return 'system';
  return name
    .split('_attachments_')[0]
    .split('_issues_')[0]
    .replace(/_(list|get|create|update|delete|search)$/, '');
}

function isAttachment(name) {
  return name.includes('_attachments_');
}

function isReadOp(name) {
  return name === 'system_ping' || /_(list|get)$/.test(name) || name.endsWith('_issues_list');
}

/**
 * Whether a tool is visible under the given profile. Unknown profiles fall back to full
 *
 * @param {string} name     tool name
 * @param {string} profile  'full' | 'core' | 'read'
 */
export function isToolInProfile(name, profile) {
  if (!profile || profile === 'full') return true;
  if (isAttachment(name)) return false;
  const coreEntity = !RARE_ENTITIES.has(entityOf(name));
  if (profile === 'core') return coreEntity;
  if (profile === 'read') return coreEntity && isReadOp(name);
  return true;
}

export function selectTools(allTools, profile) {
  if (!profile || profile === 'full') return allTools;
  return allTools.filter((tool) => tool && isToolInProfile(tool.name, profile));
}
