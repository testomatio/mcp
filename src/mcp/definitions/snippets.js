export const SNIPPETS_TOOLS = [
  {
    "name": "snippets_list",
    "description": "List snippets (/api/v2/{project_id}/snippets)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "minimum": 1
        },
        "per_page": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "snippets_get",
    "description": "Get snippet by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "snippet_id": {
          "type": "integer"
        }
      },
      "required": [
        "snippet_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "snippets_create",
    "description": "Create snippet (/api/v2/{project_id}/snippets)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "link": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "action": {
                "type": "string",
                "enum": [
                  "add",
                  "remove"
                ]
              },
              "type": {
                "type": "string",
                "enum": [
                  "label",
                  "custom_field",
                  "tag",
                  "milestone",
                  "issue",
                  "jira"
                ]
              },
              "value": {
                "type": "string"
              }
            },
            "required": [
              "action",
              "type",
              "value"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "title"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "snippets_update",
    "description": "Update snippet (/api/v2/{project_id}/snippets/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "snippet_id": {
          "type": "integer"
        },
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "link": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "action": {
                "type": "string",
                "enum": [
                  "add",
                  "remove"
                ]
              },
              "type": {
                "type": "string",
                "enum": [
                  "label",
                  "custom_field",
                  "tag",
                  "milestone",
                  "issue",
                  "jira"
                ]
              },
              "value": {
                "type": "string"
              }
            },
            "required": [
              "action",
              "type",
              "value"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "snippet_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "snippets_delete",
    "description": "Delete snippet (/api/v2/{project_id}/snippets/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "snippet_id": {
          "type": "integer"
        }
      },
      "required": [
        "snippet_id"
      ],
      "additionalProperties": false
    }
  },
];
