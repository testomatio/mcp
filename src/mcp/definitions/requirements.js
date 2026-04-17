export const REQUIREMENTS_TOOLS = [
  {
    name: 'requirements_list',
    description: 'List requirements (/api/v2/{project_id}/requirements)',
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
        source: {
          type: 'string',
          enum: ['jira', 'confluence', 'file', 'text'],
        },
        scope: {
          type: 'string',
          enum: ['global', 'attached', 'detached', 'without_suites'],
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'requirements_get',
    description: 'Get requirement by ID',
    inputSchema: {
      type: 'object',
      properties: {
        requirement_id: {
          type: 'string',
        },
      },
      required: ['requirement_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'requirements_create',
    description: 'Create requirement (/api/v2/{project_id}/requirements)',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        source_type: {
          type: 'string',
          enum: ['jira', 'confluence', 'file', 'text'],
        },
        description: {
          type: 'string',
          description: 'Required for text requirements. Must be at least 500 characters.',
        },
        details: {
          type: 'string',
        },
        active: {
          type: 'boolean',
        },
        global: {
          type: 'boolean',
        },
        confluence_url: {
          type: 'string',
          description: 'Required for confluence requirements.',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Local file paths to upload for file requirements.',
        },
      },
      required: ['title', 'source_type'],
      additionalProperties: false,
    },
  },
  {
    name: 'requirements_update',
    description: 'Update requirement (/api/v2/{project_id}/requirements/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        requirement_id: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
          description: 'Only applied for text requirements.',
        },
        details: {
          type: 'string',
        },
        active: {
          type: 'boolean',
        },
        global: {
          type: 'boolean',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Local file paths to upload for file requirements.',
        },
      },
      required: ['requirement_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'requirements_delete',
    description: 'Delete requirement (/api/v2/{project_id}/requirements/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        requirement_id: {
          type: 'string',
        },
      },
      required: ['requirement_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'requirements_search',
    description: 'Search requirements (delegates to requirements list with filters)',
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
        source: {
          type: 'string',
          enum: ['jira', 'confluence', 'file', 'text'],
        },
        scope: {
          type: 'string',
          enum: ['global', 'attached', 'detached', 'without_suites'],
        },
      },
      additionalProperties: false,
    },
  },
];
