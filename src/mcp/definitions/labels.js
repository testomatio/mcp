import { buildEntityTool } from './entity-tool.js';
import { paginationParams } from './params.js';

const VISIBILITY_PROPERTY = {
  commands: ['create', 'update'],
  type: 'array',
  items: { type: 'string', enum: ['filter', 'list'] },
};

const SCOPE_PROPERTY = {
  commands: ['create', 'update'],
  type: 'array',
  items: { type: 'string', enum: ['tests', 'suites', 'runs', 'plans', 'steps', 'templates'] },
};

export const LABELS_TOOL_SPEC = {
  name: 'labels',
  summary: 'Manage labels (/api/v2/{project_id}/labels)',
  commands: {
    list: 'List labels',
    get: 'Get label by slug',
    create: 'Create label (title required)',
    update: 'Update label by slug',
    delete: 'Delete label by slug',
  },
  params: {
    label_id: { commands: ['get', 'update', 'delete'], type: 'string', description: 'Label slug' },
    title: { commands: ['create', 'update'], type: 'string' },
    color: { commands: ['create', 'update'], type: 'string' },
    visibility: VISIBILITY_PROPERTY,
    scope: SCOPE_PROPERTY,
    field: { commands: ['create', 'update'], type: 'object' },
    ...paginationParams(['list']),
  },
};

export const LABELS_TOOL = buildEntityTool(LABELS_TOOL_SPEC);
