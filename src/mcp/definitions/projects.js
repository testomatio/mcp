export const PROJECT_TOOLS = [
  {
    name: 'project_info',
    description:
      'Get configuration and metadata for the current project (/api/v2/{project_id}/info), including framework, language, environments, labels, tags, subscription features, artifact storage status, and CI profiles.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
];
