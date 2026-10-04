import { buildEntityTool } from './entity-tool.js';

export const TAGS_TOOL_SPEC = {
  name: 'tags',
  summary: 'Tags: list with counts and get tests by tag (/api/v2/{project_id}/tags)',
  commands: {
    list: 'List tags with counts',
    get: 'Get tests by tag title (tag_id)',
    search: 'Search by tag title (delegates to get)',
  },
  params: {
    tag_id: {
      commands: ['get', 'search'],
      type: 'string',
      description: 'Tag title to look up',
    },
    query: { commands: ['search'], type: 'string' },
  },
};

export const TAGS_TOOL = buildEntityTool(TAGS_TOOL_SPEC);
