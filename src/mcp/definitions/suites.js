import { buildEntityTool } from './entity-tool.js';
import {
  attachmentParams,
  branchParam,
  issuesLinkParams,
  issuesSourceParam,
  issuesUnlinkParams,
  linkActionParam,
  paginationParams,
} from './params.js';

const SUITE_ID_COMMANDS = [
  'get',
  'update',
  'delete',
  'unshare',
  'issues_list',
  'issues_link',
  'issues_unlink',
  'attachments_list',
  'attachments_upload',
  'attachments_delete',
];

export const SUITES_TOOL_SPEC = {
  name: 'suites',
  summary: 'Manage suites as tree (/api/v2/{project_id}/suites)',
  commands: {
    list: 'List suites as tree (filters: file_type, tag, labels, search_text)',
    get: 'Get suite by ID',
    create: 'Create suite (title required)',
    update: 'Update suite by ID',
    delete: 'Delete suite by ID',
    share:
      'Share suites (with their tests) into one or more other projects. Select by suite_ids, labels, or both. File-type suites are linked (read-only copies that stay in sync); folder suites are deep-copied as editable copies; re-sharing a linked suite into a project that already has it does not duplicate; suites that are themselves shared copies link to their original source; omit destination_folder_id to share into the root; processed asynchronously; projects must be of the same type (Classic/BDD).',
    unshare:
      "Remove a suite's share, converting the shared copy back into a regular, editable suite. Only the shared (linked) copy can be targeted — the original source suite is untouched. Must be called against the project that holds the shared copy.",
    issues_list: 'List linked issues for a suite',
    issues_link: 'Link issue to a suite (url or jira_id)',
    issues_unlink: 'Unlink issue from a suite',
    attachments_list: 'List attachments for a suite',
    attachments_upload: 'Upload one attachment to a suite',
    attachments_delete: 'Delete attachment from a suite',
  },
  params: {
    suite_id: {
      commands: SUITE_ID_COMMANDS,
      type: 'string',
      description: 'Suite ID (for unshare: ID of the shared suite copy to unlink)',
    },
    title: { commands: ['create', 'update'], type: 'string' },
    description: { commands: ['create', 'update'], type: 'string' },
    emoji: { commands: ['create', 'update'], type: 'string' },
    parent_id: { commands: ['create', 'update'], type: 'string', description: 'Parent suite ID' },
    file_type: {
      commands: ['list', 'create', 'update'],
      type: 'string',
      enum: ['file', 'folder'],
      description: 'list: filter by type; create/update: the type of suite',
    },
    assigned_to: { commands: ['create', 'update'], type: 'string' },
    file: { commands: ['create', 'update'], type: 'string' },
    children: { commands: ['create', 'update'], type: 'array', items: {} },
    link: linkActionParam(['create', 'update'], ['requirement']),
    tag: { commands: ['list'], type: 'string', description: 'Filter by tag title' },
    labels: {
      commands: ['list', 'share'],
      type: ['string', 'array'],
      items: { type: 'string' },
      description:
        'list: filter by label slugs/titles; share: every suite carrying any of these labels is shared, in addition to suite_ids.',
    },
    search_text: { commands: ['list'], type: 'string' },
    ...branchParam(['list', 'get', 'create', 'update', 'delete']),
    ...paginationParams(['list', 'issues_list']),
    ...issuesSourceParam(['issues_list']),
    ...issuesLinkParams(['issues_link']),
    ...issuesUnlinkParams(['issues_unlink']),
    ...attachmentParams(),
    suite_ids: {
      commands: ['share'],
      type: 'array',
      items: { type: 'string' },
      description: 'Suite IDs to share. At least one of suite_ids/labels is required. Max 200 suites per request.',
    },
    target_project_ids: {
      commands: ['share'],
      type: 'array',
      items: { type: 'string' },
      description: 'Project IDs (slugs) of the destination projects. Must be accessible to the current user.',
    },
    destination_folder_id: {
      commands: ['share'],
      type: 'string',
      description:
        'Folder suite ID in the target project to place the shared suites into. Only allowed when sharing to a single target project.',
    },
  },
};

export const SUITES_TOOL = buildEntityTool(SUITES_TOOL_SPEC);
