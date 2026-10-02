import { buildEntityTool } from './entity-tool.js';
import { paginationParams } from './params.js';

export const ISSUES_TOOL_SPEC = {
  name: 'issues',
  summary: 'Linked issues across resources (/api/v2/{project_id}/issues)',
  commands: {
    list: 'List linked issues (scope by test_id/suite_id/run_id/testrun_id/plan_id, filter by source)',
    create: 'Link issue to a resource (url or jira_id + one scope id)',
    delete: 'Unlink issue',
  },
  params: {
    test_id: { commands: ['list', 'create'], type: 'string' },
    suite_id: { commands: ['list', 'create'], type: 'string' },
    run_id: { commands: ['list', 'create'], type: 'string' },
    testrun_id: { commands: ['list', 'create'], type: 'integer' },
    plan_id: { commands: ['list', 'create'], type: 'string' },
    source: { commands: ['list'], type: 'string', description: 'Filter issues by source (e.g. jira)' },
    url: { commands: ['create'], type: 'string', description: 'Issue URL to link' },
    jira_id: { commands: ['create'], type: 'string', description: 'Jira issue key to link (alternative to url)' },
    issue_id: { commands: ['delete'], type: 'integer', description: 'ID of the linked issue to remove' },
    type: {
      commands: ['delete'],
      type: 'string',
      enum: ['issue', 'jira_issue'],
      description: 'Kind of the linked issue',
    },
    ...paginationParams(['list']),
  },
};

export const ISSUES_TOOL = buildEntityTool(ISSUES_TOOL_SPEC);
