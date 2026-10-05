const CRUD_COMMANDS = ['list', 'get', 'create', 'update', 'delete'];
const ISSUE_COMMANDS = ['issues_list', 'issues_link', 'issues_unlink'];
const ATTACHMENT_COMMANDS = ['attachments_list', 'attachments_upload', 'attachments_delete'];

export const ENTITY_COMMANDS = {
  tests: [...CRUD_COMMANDS, 'share', 'unshare', ...ISSUE_COMMANDS, ...ATTACHMENT_COMMANDS],
  suites: [...CRUD_COMMANDS, 'share', 'unshare', ...ISSUE_COMMANDS, ...ATTACHMENT_COMMANDS],
  runs: [...CRUD_COMMANDS, 'stats', ...ISSUE_COMMANDS],
  testruns: [...CRUD_COMMANDS, ...ISSUE_COMMANDS, ...ATTACHMENT_COMMANDS],
  plans: [...CRUD_COMMANDS, ...ISSUE_COMMANDS],
  rungroups: [...CRUD_COMMANDS],
  steps: [...CRUD_COMMANDS],
  snippets: [...CRUD_COMMANDS],
  labels: [...CRUD_COMMANDS],
  requirements: [...CRUD_COMMANDS],
  branches: [...CRUD_COMMANDS],
  tags: ['list', 'get', 'search'],
  milestones: ['list', 'get'],
  issues: ['list', 'create', 'delete'],
};

export const READ_ONLY_COMMANDS = new Set([
  'list',
  'get',
  'search',
  'stats',
  'issues_list',
  'attachments_list',
]);
