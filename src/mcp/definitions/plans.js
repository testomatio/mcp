import { PLANS_TQL_INPUT_DESCRIPTION, PLANS_TQL_REFERENCE } from './tql-reference.js';
import { buildEntityTool } from './entity-tool.js';
import {
  idArrayParam,
  issuesLinkParams,
  issuesSourceParam,
  issuesUnlinkParams,
  linkActionParam,
  paginationParams,
} from './params.js';

export const PLANS_TOOL_SPEC = {
  name: 'plans',
  summary: `Manage test plans (/api/v2/{project_id}/plans). ${PLANS_TQL_REFERENCE}`,
  commands: {
    list: 'List plans (kind, hidden, labels, search_text filters)',
    get: 'Get plan by ID',
    create: 'Create plan (title required; select tests via test_ids/suite_ids/tql)',
    update: 'Update plan by ID',
    delete: 'Delete plan by ID',
    issues_list: 'List linked issues for a plan',
    issues_link: 'Link issue to a plan (url or jira_id)',
    issues_unlink: 'Unlink issue from a plan',
  },
  params: {
    plan_id: { commands: ['get', 'update', 'delete', 'issues_list', 'issues_link'], type: 'string' },
    title: { commands: ['create', 'update'], type: 'string' },
    description: { commands: ['create', 'update'], type: 'string' },
    kind: {
      commands: ['list', 'create', 'update'],
      type: 'string',
      enum: ['manual', 'automated', 'mixed'],
      description: 'list: filter by kind; create/update: the plan kind',
    },
    hidden: { commands: ['list', 'create', 'update'], type: 'boolean', description: 'list: include hidden plans; create/update: set hidden flag' },
    as_manual: { commands: ['create', 'update'], type: 'boolean' },
    labels: { commands: ['list'], type: 'array', items: { type: 'string' } },
    search_text: { commands: ['list'], type: 'string' },
    tql: {
      commands: ['create', 'update'],
      type: 'string',
      description: PLANS_TQL_INPUT_DESCRIPTION,
    },
    test_ids: idArrayParam(
      ['create', 'update'],
      'List of test IDs (8-char) to include in the plan. If omitted, all tests matching the plan kind are included.'
    ),
    suite_ids: idArrayParam(
      ['create', 'update'],
      'List of suite IDs (8-char) to include in the plan. If omitted, all suites are considered.'
    ),
    link: linkActionParam(['create', 'update']),
    ...paginationParams(['list', 'issues_list']),
    ...issuesSourceParam(['issues_list']),
    ...issuesLinkParams(['issues_link']),
    ...issuesUnlinkParams(['issues_unlink']),
  },
};

export const PLANS_TOOL = buildEntityTool(PLANS_TOOL_SPEC);
