import { buildEntityTool } from './entity-tool.js';
import { linkActionParam, paginationParams } from './params.js';

export const STEPS_TOOL_SPEC = {
  name: 'steps',
  summary: 'Manage test steps (/api/v2/{project_id}/steps)',
  commands: {
    list: 'List steps',
    get: 'Get step by ID',
    create: 'Create step (title required)',
    update: 'Update step by ID',
    delete: 'Delete step by ID',
  },
  params: {
    step_id: { commands: ['get', 'update', 'delete'], type: 'integer' },
    title: { commands: ['create', 'update'], type: 'string' },
    description: { commands: ['create', 'update'], type: 'string' },
    link: linkActionParam(['create', 'update']),
    ...paginationParams(['list']),
  },
};

export const STEPS_TOOL = buildEntityTool(STEPS_TOOL_SPEC);
