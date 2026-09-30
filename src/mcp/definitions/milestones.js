import { buildEntityTool } from './entity-tool.js';
import { paginationParams } from './params.js';

export const MILESTONES_TOOL_SPEC = {
  name: 'milestones',
  summary: 'Milestones: list and get (/api/v2/{project_id}/milestones)',
  commands: {
    list: 'List milestones (type, status filters)',
    get: 'Get milestone by ID',
  },
  params: {
    milestone_id: { commands: ['get'], type: 'string' },
    type: {
      commands: ['list'],
      type: 'string',
      description: 'Filter by milestone type (title), e.g. Sprint or Release.',
    },
    status: {
      commands: ['list'],
      type: 'string',
      enum: ['created', 'active', 'closed'],
    },
    ...paginationParams(['list']),
  },
};

export const MILESTONES_TOOL = buildEntityTool(MILESTONES_TOOL_SPEC);
