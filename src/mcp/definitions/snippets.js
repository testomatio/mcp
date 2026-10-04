import { buildEntityTool } from './entity-tool.js';
import { linkActionParam, paginationParams } from './params.js';

export const SNIPPETS_TOOL_SPEC = {
  name: 'snippets',
  summary: 'Manage code snippets (/api/v2/{project_id}/snippets)',
  commands: {
    list: 'List snippets',
    get: 'Get snippet by ID',
    create: 'Create snippet (title required)',
    update: 'Update snippet by ID',
    delete: 'Delete snippet by ID',
  },
  params: {
    snippet_id: { commands: ['get', 'update', 'delete'], type: 'integer' },
    title: { commands: ['create', 'update'], type: 'string' },
    description: { commands: ['create', 'update'], type: 'string' },
    link: linkActionParam(['create', 'update']),
    ...paginationParams(['list']),
  },
};

export const SNIPPETS_TOOL = buildEntityTool(SNIPPETS_TOOL_SPEC);
