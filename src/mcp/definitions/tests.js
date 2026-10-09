import { TESTS_TQL_INPUT_DESCRIPTION, TESTS_TQL_REFERENCE } from './tql-reference.js';
import { buildEntityTool } from './entity-tool.js';
import {
  attachmentParams,
  branchParam,
  idArrayParam,
  issuesLinkParams,
  issuesSourceParam,
  issuesUnlinkParams,
  linkActionParam,
  paginationParams,
} from './params.js';

const TEST_ID_COMMANDS = [
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

export const TESTS_TOOL_SPEC = {
  name: 'tests',
  summary: `Manage tests (/api/v2/{project_id}/tests). ${TESTS_TQL_REFERENCE}`,
  commands: {
    list: 'List tests (tql filter, pagination)',
    get: 'Get test by ID',
    create: 'Create test (title and suite_id required)',
    update: 'Update test by ID',
    delete: 'Delete test by ID',
    bulk_upsert:
      'Bulk create/update tests from a testomat.io classical tests markdown document. Tests with an id (@T...) in their metadata are updated, tests without id are created. Suites are resolved by id (@S...) or title, and created when missing. Up to 100 tests and 25 suites per call, sent in batches of 50. tags/labels in the markdown are parsed but not applied.',
    share:
      'Share tests into a suite of another project. Select by test_ids, labels, or both. Source project stays the single source of truth; shared copies are read-only until unlinked; re-sharing does not duplicate; processed asynchronously ("queued" = accepted); skipped shared copies are listed in skipped_test_ids; projects must be of the same type (Classic/BDD).',
    unshare:
      "Remove a test's share, converting the shared copy back into a regular, editable test. Only the shared copy can be targeted — the original source test is untouched. Must be called against the project that holds the shared copy.",
    issues_list: 'List linked issues for a test',
    issues_link: 'Link issue to a test (url or jira_id)',
    issues_unlink: 'Unlink issue from a test',
    attachments_list: 'List attachments for a test',
    attachments_upload: 'Upload one attachment to a test',
    attachments_delete: 'Delete attachment from a test',
  },
  params: {
    test_id: {
      commands: TEST_ID_COMMANDS,
      type: 'string',
      description: 'Test ID (for unshare: ID of the shared test copy to unlink)',
    },
    title: { commands: ['create', 'update'], type: 'string' },
    suite_id: { commands: ['create', 'update'], type: 'string', description: 'Suite to place the test in' },
    description: { commands: ['create', 'update'], type: 'string' },
    emoji: { commands: ['create', 'update'], type: 'string' },
    priority: {
      commands: ['create', 'update'],
      type: 'string',
      enum: ['low', 'normal', 'important', 'high', 'critical'],
    },
    assigned_to: { commands: ['create', 'update'], type: 'string' },
    code: { commands: ['create', 'update'], type: 'string' },
    state: {
      commands: ['create', 'update'],
      type: 'string',
      enum: ['manual', 'detached', 'automated'],
    },
    sync: { commands: ['update'], type: 'boolean' },
    link: linkActionParam(['create', 'update']),
    tql: { commands: ['list'], type: 'string', description: TESTS_TQL_INPUT_DESCRIPTION },
    markdown: {
      commands: ['bulk_upsert'],
      type: 'string',
      description:
        'Required for bulk_upsert. Markdown document in the testomat.io classical tests format: suite blocks (<!-- suite ... -->) containing test blocks (<!-- test ... -->), each followed by a title heading and a description. See https://docs.testomat.io/project/import-export/export-tests/classical-tests-markdown-format/',
    },
    dry_run: {
      commands: ['bulk_upsert'],
      type: 'boolean',
      default: false,
      description: 'Parse the document and report the planned actions without writing anything',
    },
    create_missing_suites: {
      commands: ['bulk_upsert'],
      type: 'boolean',
      default: true,
      description:
        'Create suites that cannot be resolved by id or title. When false, tests of unresolved suites are reported as errors',
    },
    ...branchParam(['list', 'get', 'create', 'update', 'delete', 'bulk_upsert']),
    ...paginationParams(['list', 'issues_list']),
    ...issuesSourceParam(['issues_list']),
    ...issuesLinkParams(['issues_link']),
    ...issuesUnlinkParams(['issues_unlink']),
    ...attachmentParams(),
    test_ids: idArrayParam(
      ['share'],
      'Test IDs to share. At least one of test_ids/labels is required. Max 1000 tests per request.'
    ),
    labels: {
      commands: ['share'],
      type: 'array',
      items: { type: 'string' },
      description:
        'Label slugs or titles; every test carrying any of these labels is shared, in addition to test_ids.',
    },
    target_project_id: {
      commands: ['share'],
      type: 'string',
      description: 'Project ID (slug) of the destination project. Must be accessible to the current user.',
    },
    target_suite_id: {
      commands: ['share'],
      type: 'string',
      description: 'Suite ID in the target project to place the shared tests into. Must be a file-type suite, not a folder.',
    },
  },
};

export const TESTS_TOOL = buildEntityTool(TESTS_TOOL_SPEC);
