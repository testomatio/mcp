import { BRANCH_PARAM } from './branches.js';

export function paginationParams(commands) {
  return {
    page: { commands, type: 'integer', minimum: 1 },
    per_page: { commands, type: 'integer', minimum: 1, maximum: 100 },
  };
}

export function branchParam(commands) {
  return { branch: { commands, ...BRANCH_PARAM } };
}

export function stringArrayParam(commands, description) {
  return {
    type: 'array',
    items: { type: 'string' },
    ...(description ? { description } : {}),
    commands,
  };
}

export function idArrayParam(commands, description) {
  return stringArrayParam(commands, description);
}

export function linkActionParam(commands, extraTypes = []) {
  const types = ['label', 'custom_field', 'tag', 'milestone', 'issue', 'jira', ...extraTypes];
  return {
    commands,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'remove'] },
        type: { type: 'string', enum: types },
        value: { type: 'string' },
      },
      required: ['action', 'type', 'value'],
      additionalProperties: false,
    },
  };
}

export function issuesSourceParam(commands) {
  return { source: { commands, type: 'string', description: 'Filter issues by source (e.g. jira)' } };
}

export function issuesLinkParams(commands) {
  return {
    url: { commands, type: 'string', description: 'Issue URL to link' },
    jira_id: { commands, type: 'string', description: 'Jira issue key to link (alternative to url)' },
  };
}

export function issuesUnlinkParams(commands) {
  return {
    issue_id: { commands, type: 'integer', description: 'ID of the linked issue to remove' },
    type: { commands, type: 'string', enum: ['issue', 'jira_issue'], description: 'Kind of the linked issue' },
  };
}

export function attachmentParams() {
  return {
    file_path: {
      commands: ['attachments_upload'],
      type: 'string',
      description: 'Local path to the file that will be sent as multipart/form-data field "files".',
    },
    attachment_id: {
      commands: ['attachments_delete'],
      type: 'string',
      description: 'ID of the attachment to delete',
    },
  };
}
