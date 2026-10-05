import { buildEntityTool } from './entity-tool.js';
import {
  attachmentParams,
  issuesLinkParams,
  issuesSourceParam,
  issuesUnlinkParams,
  paginationParams,
} from './params.js';

const arrayOrString = { type: ['array', 'string'], items: { type: 'string' } };

export const TESTRUNS_TOOL_SPEC = {
  name: 'testruns',
  summary: 'Manage individual test runs (/api/v2/{project_id}/testruns)',
  commands: {
    list: 'List testruns (rich filters: filter_status, filter_kind, tags, labels, envs, rungroups, defects, ...)',
    get: 'Get testrun by ID',
    create: 'Create testrun in a run (run_id required)',
    update: 'Update testrun by ID',
    delete: 'Delete testrun by ID',
    issues_list: 'List linked issues for a testrun',
    issues_link: 'Link issue to a testrun (url or jira_id)',
    issues_unlink: 'Unlink issue from a testrun',
    attachments_list: 'List attachments for a testrun',
    attachments_upload: 'Upload one attachment to a testrun',
    attachments_delete: 'Delete attachment from a testrun',
  },
  params: {
    testrun_id: {
      commands: ['get', 'update', 'delete', 'issues_list', 'issues_link', 'attachments_list', 'attachments_upload', 'attachments_delete'],
      type: 'integer',
    },
    run_id: {
      commands: ['list', 'create', 'update'],
      type: 'string',
      description: 'list: filter by run; create/update: the run the testrun belongs to',
    },
    test_id: { commands: ['create', 'update'], type: 'string' },
    test_ids: { commands: ['list'], ...arrayOrString },
    sort: {
      commands: ['list'],
      type: 'string',
      enum: ['created_at', 'suite', 'testcase', 'failure'],
      description: 'Sort field. Default order is oldest-first — use created_at with order=desc to get the most recent executions first.',
    },
    order: {
      commands: ['list'],
      type: 'string',
      enum: ['asc', 'desc'],
      description: 'Sort direction. Defaults to asc.',
    },
    status: {
      commands: ['create', 'update'],
      type: 'string',
      enum: ['passed', 'failed', 'skipped', 'pending'],
    },
    message: { commands: ['create', 'update'], type: 'string' },
    run_time: { commands: ['create', 'update'], type: 'number' },
    assigned_to: { commands: ['create', 'update'], type: 'string' },
    test_title: { commands: ['create', 'update'], type: 'string' },
    automated: { commands: ['create', 'update'], type: 'boolean' },
    filter_status: {
      commands: ['list'],
      type: 'string',
      enum: ['passed', 'failed', 'skipped', 'pending'],
    },
    filter_kind: { commands: ['list'], type: 'string', enum: ['manual', 'automated'] },
    filter_user: { commands: ['list'], type: ['integer', 'string'] },
    filter_priority: {
      commands: ['list'],
      type: 'string',
      enum: ['low', 'normal', 'important', 'high', 'critical'],
    },
    filter_substatus: { commands: ['list'], type: 'string' },
    filter_search: { commands: ['list'], type: 'string' },
    filter_message: { commands: ['list'], type: 'boolean' },
    filter_link: { commands: ['list'], type: 'boolean' },
    filter_finished_at_date_range: { commands: ['list'], type: 'string' },
    tags: { commands: ['list'], ...arrayOrString },
    labels: { commands: ['list'], ...arrayOrString },
    envs: { commands: ['list'], ...arrayOrString },
    rungroups: { commands: ['list'], ...arrayOrString },
    defects: { commands: ['list'], type: 'string', enum: ['has_defects', 'without_defects'] },
    ...paginationParams(['list', 'issues_list']),
    ...issuesSourceParam(['issues_list']),
    ...issuesLinkParams(['issues_link']),
    ...issuesUnlinkParams(['issues_unlink']),
    ...attachmentParams(),
  },
};

export const TESTRUNS_TOOL = buildEntityTool(TESTRUNS_TOOL_SPEC);
