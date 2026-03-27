export const TAGS_TOOLS = [
  {
    "name": "tags_list",
    "description": "List tags with counts (/api/v2/{project_id}/tags)",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "additionalProperties": false
    }
  },
  {
    "name": "tags_get",
    "description": "Get tests by tag title (/api/v2/{project_id}/tags/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "tag_id": {
          "type": "string"
        }
      },
      "required": [
        "tag_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tags_search",
    "description": "Search by tag title (delegates to tags_get)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "tag_id": {
          "type": "string"
        },
        "query": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  }
];
