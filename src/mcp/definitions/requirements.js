import { buildEntityTool } from './entity-tool.js';
import { paginationParams } from './params.js';

export const REQUIREMENTS_TOOL_SPEC = {
  name: 'requirements',
  summary: 'Manage requirements (/api/v2/{project_id}/requirements)',
  commands: {
    list: 'List requirements (source, scope filters)',
    get: 'Get requirement by ID',
    create: 'Create requirement (title and source_type required)',
    update: 'Update requirement by ID',
    delete: 'Delete requirement by ID',
  },
  params: {
    requirement_id: { commands: ['get', 'update', 'delete'], type: 'string' },
    title: { commands: ['create', 'update'], type: 'string' },
    source_type: { commands: ['create'], type: 'string', enum: ['jira', 'confluence', 'file', 'text'] },
    source: { commands: ['list'], type: 'string', enum: ['jira', 'confluence', 'file', 'text'] },
    scope: { commands: ['list'], type: 'string', enum: ['global', 'attached', 'detached', 'without_suites'] },
    description: {
      commands: ['create', 'update'],
      type: 'string',
      description: 'Required for text requirements (min 500 chars on create); only applied for text requirements on update.',
    },
    details: { commands: ['create', 'update'], type: 'string' },
    active: { commands: ['create', 'update'], type: 'boolean' },
    global: { commands: ['create', 'update'], type: 'boolean' },
    confluence_url: {
      commands: ['create'],
      type: 'string',
      description: 'Required for confluence requirements.',
    },
    files: {
      commands: ['create', 'update'],
      type: 'array',
      items: { type: 'string' },
      description: 'Local file paths to upload for file requirements.',
    },
    ...paginationParams(['list']),
  },
};

export const REQUIREMENTS_TOOL = buildEntityTool(REQUIREMENTS_TOOL_SPEC);
