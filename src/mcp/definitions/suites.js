export const SUITES_TOOLS = [
  {
    "name": "suites_list",
    "description": "List suites as tree (/api/v2/{project_id}/suites)",
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
        },
        "file_type": {
          "type": "string",
          "enum": [
            "file",
            "folder"
          ]
        },
        "tag": {
          "type": "string"
        },
        "labels": {
          "type": "string"
        },
        "search_text": {
          "type": "string"
        },
        "query": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "suites_get",
    "description": "Get suite by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "suite_id": {
          "type": "string"
        }
      },
      "required": [
        "suite_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "suites_create",
    "description": "Create suite (/api/v2/{project_id}/suites)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "emoji": {
          "type": "string"
        },
        "parent_id": {
          "type": "string"
        },
        "file_type": {
          "type": "string"
        },
        "assigned_to": {
          "type": "string"
        },
        "file": {
          "type": "string"
        },
        "children": {
          "type": "array"
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
    "name": "suites_update",
    "description": "Update suite (/api/v2/{project_id}/suites/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "suite_id": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "emoji": {
          "type": "string"
        },
        "parent_id": {
          "type": "string"
        },
        "file_type": {
          "type": "string"
        },
        "assigned_to": {
          "type": "string"
        },
        "file": {
          "type": "string"
        },
        "children": {
          "type": "array"
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
        "suite_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "suites_delete",
    "description": "Delete suite",
    "inputSchema": {
      "type": "object",
      "properties": {
        "suite_id": {
          "type": "string"
        }
      },
      "required": [
        "suite_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "suites_search",
    "description": "Search suites by title (delegates to suites list with search_text)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "search_text": {
          "type": "string"
        },
        "query": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "minimum": 1
        },
        "per_page": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100
        },
        "file_type": {
          "type": "string",
          "enum": [
            "file",
            "folder"
          ]
        },
        "tag": {
          "type": "string"
        },
        "labels": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "suites_issues_list",
    "description": "List linked issues for a suite (/api/v2/{project_id}/issues?suite_id=...)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "suite_id": {
          "type": "string"
        },
        "page": {
          "type": "integer",
          "minimum": 1
        },
        "per_page": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100
        },
        "source": {
          "type": "string"
        }
      },
      "required": [
        "suite_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "suites_issues_link",
    "description": "Link issue to a suite (/api/v2/{project_id}/issues)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "suite_id": {
          "type": "string"
        },
        "url": {
          "type": "string"
        },
        "jira_id": {
          "type": "string"
        }
      },
      "required": [
        "suite_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "suites_issues_unlink",
    "description": "Unlink issue from a suite (/api/v2/{project_id}/issues/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "issue_id": {
          "type": "integer"
        },
        "type": {
          "type": "string",
          "enum": [
            "issue",
            "jira_issue"
          ]
        }
      },
      "required": [
        "issue_id",
        "type"
      ],
      "additionalProperties": false
    }
  }
];
