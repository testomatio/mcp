function buildAttachmentTools({ toolPrefix, entityName, idKey, idType = 'string' }) {
  const entityId = {
    type: idType,
  };

  return [
    {
      name: `${toolPrefix}_attachments_list`,
      description: `List attachments for a ${entityName} (/api/v2/{project_id}/attachments?${idKey}=...)`,
      inputSchema: {
        type: 'object',
        properties: {
          [idKey]: entityId,
        },
        required: [idKey],
        additionalProperties: false,
      },
    },
    {
      name: `${toolPrefix}_attachments_upload`,
      description: `Upload one attachment to a ${entityName} (/api/v2/{project_id}/attachments?${idKey}=...)`,
      inputSchema: {
        type: 'object',
        properties: {
          [idKey]: entityId,
          file_path: {
            type: 'string',
            description: 'Local path to the file that will be sent as multipart/form-data field "file".',
          },
        },
        required: [idKey, 'file_path'],
        additionalProperties: false,
      },
    },
    {
      name: `${toolPrefix}_attachments_delete`,
      description: `Delete attachment from a ${entityName} (/api/v2/{project_id}/attachments/{id}?${idKey}=...)`,
      inputSchema: {
        type: 'object',
        properties: {
          [idKey]: entityId,
          attachment_id: {
            type: 'string',
          },
        },
        required: [idKey, 'attachment_id'],
        additionalProperties: false,
      },
    },
  ];
}

export const ATTACHMENT_TOOLS = [
  ...buildAttachmentTools({
    toolPrefix: 'tests',
    entityName: 'test',
    idKey: 'test_id',
  }),
  ...buildAttachmentTools({
    toolPrefix: 'suites',
    entityName: 'suite',
    idKey: 'suite_id',
  }),
  ...buildAttachmentTools({
    toolPrefix: 'testruns',
    entityName: 'testrun',
    idKey: 'testrun_id',
    idType: 'integer',
  }),
];
