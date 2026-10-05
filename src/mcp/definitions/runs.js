import { RUNS_TQL_INPUT_DESCRIPTION, RUNS_TQL_REFERENCE } from './tql-reference.js';
import { buildEntityTool } from './entity-tool.js';
import {
  branchParam,
  issuesLinkParams,
  issuesSourceParam,
  issuesUnlinkParams,
  linkActionParam,
  paginationParams,
} from './params.js';

export const RUNS_TOOL_SPEC = {
  name: 'runs',
  summary: `Manage runs (/api/v2/{project_id}/runs). ${RUNS_TQL_REFERENCE}`,
  commands: {
    list: 'List runs (tql filter, pagination)',
    get: 'Get run by ID',
    create: 'Create run (title required)',
    update: 'Update run by ID',
    delete: 'Delete run by ID',
    stats: 'Break down one run\'s testruns by suite, tag, label, assignee, or priority (/api/v2/{project_id}/runs/{id}/stats/{dimension}). Each row has passed_count, failed_count, skipped_count, pending_count for its group — answers "which areas/owners are affected by this run\'s failures". Paginated with a fixed page size; meta uses page/perPage/totalCount/totalPages',
    issues_list: 'List linked issues for a run',
    issues_link: 'Link issue to a run (url or jira_id)',
    issues_unlink: 'Unlink issue from a run',
  },
  params: {
    run_id: {
      commands: ['get', 'update', 'delete', 'stats', 'issues_list', 'issues_link'],
      type: 'string',
    },
    dimension: {
      commands: ['stats'],
      type: 'string',
      enum: ['suites', 'tags', 'labels', 'assignees', 'priorities'],
    },
    sort_field: {
      commands: ['stats'],
      type: 'string',
      description: 'Column to sort by, e.g. failed_count.',
    },
    sort_direction: { commands: ['stats'], type: 'string', enum: ['asc', 'desc'] },
    title: { commands: ['create', 'update'], type: 'string' },
    description: { commands: ['create', 'update'], type: 'string' },
    plan_ids: { commands: ['create'], type: 'array', items: { type: 'string' } },
    kind: {
      commands: ['create', 'update'],
      type: 'string',
      enum: ['manual', 'automated', 'mixed'],
    },
    rungroup_id: { commands: ['create', 'update'], type: 'string' },
    env: { commands: ['create', 'update'], type: 'string' },
    status_event: {
      commands: ['update'],
      type: 'string',
      enum: ['finish', 'finish_manual', 'launch', 'rerun', 'scheduled', 'terminate'],
    },
    assigned_to: { commands: ['create', 'update'], type: 'string' },
    assign_strategy: {
      commands: ['create', 'update'],
      type: 'string',
      enum: ['test', 'random', 'none'],
    },
    test_ids: { commands: ['create', 'update'], type: 'array', items: { type: 'string' } },
    suite_ids: { commands: ['create', 'update'], type: 'array', items: { type: 'string' } },
    envs: { commands: ['create'], type: 'array', items: { type: 'string' } },
    link: linkActionParam(['create', 'update']),
    tql: { commands: ['list'], type: 'string', description: RUNS_TQL_INPUT_DESCRIPTION },
    ...branchParam(['list', 'get', 'create', 'update', 'delete']),
    ...paginationParams(['list', 'issues_list']),
    page: { commands: ['list', 'issues_list', 'stats'], type: 'integer', minimum: 1 },
    ...issuesSourceParam(['issues_list']),
    ...issuesLinkParams(['issues_link']),
    ...issuesUnlinkParams(['issues_unlink']),
  },
};

export const RUNS_TOOL = buildEntityTool(RUNS_TOOL_SPEC);
