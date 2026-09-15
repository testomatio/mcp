export const MILESTONES_TOOLS = [
  {
    name: 'milestones_list',
    description: 'List milestones (/api/v2/{project_id}/milestones)',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          minimum: 1,
        },
        per_page: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
        type: {
          type: 'string',
          description: 'Filter by milestone type (title), e.g. Sprint or Release.',
        },
        status: {
          type: 'string',
          enum: ['created', 'active', 'closed'],
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'milestones_get',
    description: 'Get milestone by ID',
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: {
          type: 'string',
        },
      },
      required: ['milestone_id'],
      additionalProperties: false,
    },
  },
];
