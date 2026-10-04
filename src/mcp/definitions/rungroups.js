import { buildEntityTool } from './entity-tool.js';
import { paginationParams } from './params.js';

export const RUNGROUPS_TOOL_SPEC = {
  name: 'rungroups',
  summary: 'Manage run groups as tree (/api/v2/{project_id}/rungroups)',
  commands: {
    list: 'List run groups as tree',
    get: 'Get run group by ID',
    create: 'Create run group (title required)',
    update: 'Update run group by ID',
    delete: 'Delete run group by ID',
  },
  params: {
    rungroup_id: { commands: ['get', 'update', 'delete'], type: 'string' },
    title: { commands: ['create', 'update'], type: 'string' },
    description: { commands: ['create', 'update'], type: 'string' },
    emoji: { commands: ['create', 'update'], type: 'string' },
    kind: { commands: ['create', 'update'], type: 'string' },
    pin: { commands: ['create', 'update'], type: 'boolean' },
    status: { commands: ['create', 'update'], type: 'string' },
    parent_id: { commands: ['create', 'update'], type: 'string' },
    children: { commands: ['create', 'update'], type: 'array', items: {} },
    ...paginationParams(['list']),
  },
};

export const RUNGROUPS_TOOL = buildEntityTool(RUNGROUPS_TOOL_SPEC);
