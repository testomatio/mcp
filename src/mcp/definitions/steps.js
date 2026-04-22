export const STEPS_TOOLS = [
  {
    "name": "steps_list",
    "description": "List steps (/api/v2/{project_id}/steps)",
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
    "name": "steps_get",
    "description": "Get step by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "step_id": {
          "type": "integer"
        }
      },
      "required": [
        "step_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "steps_create",
    "description": "Create step (/api/v2/{project_id}/steps)",
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
    "name": "steps_update",
    "description": "Update step (/api/v2/{project_id}/steps/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "step_id": {
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
        "step_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "steps_delete",
    "description": "Delete step (/api/v2/{project_id}/steps/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "step_id": {
          "type": "integer"
        }
      },
      "required": [
        "step_id"
      ],
      "additionalProperties": false
    }
  },
];
