import { buildEntityTool } from './entity-tool.js';
import { paginationParams } from './params.js';

export const BRANCH_PARAM = {
  "type": "string",
  "description": "Branch slug to scope the request to (omit or main for the main branch). For tests and suites, a branch-local record is used when it exists, falling back to main; updating/deleting a main-only record forks an isolated copy into the branch. Runs are tagged with the branch (only reachable with the same branch afterwards). Requires the branches feature."
};

export const BRANCHES_TOOL_SPEC = {
  name: 'branches',
  summary:
    'Manage project branches (/api/v2/{project_id}/branches). Requires the branches feature (enterprise plan).',
  commands: {
    list: 'List project branches (filter_state / filter_title to narrow down)',
    get: 'Get branch by slug',
    create: 'Create branch (title required; slug is generated from it)',
    update: 'Update branch title',
    delete: 'Delete branch by slug',
  },
  params: {
    branch_id: { commands: ['get', 'update', 'delete'], type: 'string', description: 'Branch slug' },
    title: {
      commands: ['create', 'update'],
      type: 'string',
      description: 'Branch title; a slug is generated from it',
    },
    filter_state: {
      commands: ['list'],
      type: 'string',
      enum: ['active', 'merged'],
      description: 'Filter by branch state',
    },
    filter_title: {
      commands: ['list'],
      type: 'string',
      description: 'Filter by title (partial substring match)',
    },
    ...paginationParams(['list']),
  },
};

export const BRANCHES_TOOL = buildEntityTool(BRANCHES_TOOL_SPEC);
