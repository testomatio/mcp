export const TESTS_TOOLS = [
  {
    "name": "tests_list",
    "description": "List tests (/api/v2/{project_id}/tests)",
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
        "suite_id": {
          "type": "string"
        },
        "search_text": {
          "type": "string"
        },
        "query": {
          "type": "string"
        },
        "assigned_to": {
          "type": "string"
        },
        "priority": {
          "type": "string"
        },
        "state": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "tests_get",
    "description": "Get test by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_id": {
          "type": "string"
        }
      },
      "required": [
        "test_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tests_create",
    "description": "Create test (/api/v2/{project_id}/tests)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "suite_id": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "emoji": {
          "type": "string"
        },
        "priority": {
          "type": "string"
        },
        "assigned_to": {
          "type": "string"
        },
        "code": {
          "type": "string"
        },
        "state": {
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
        "title",
        "suite_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tests_update",
    "description": "Update test (/api/v2/{project_id}/tests/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_id": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "suite_id": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "emoji": {
          "type": "string"
        },
        "priority": {
          "type": "string"
        },
        "assigned_to": {
          "type": "string"
        },
        "code": {
          "type": "string"
        },
        "state": {
          "type": "string"
        },
        "sync": {
          "type": "boolean"
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
        "test_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tests_delete",
    "description": "Delete test",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_id": {
          "type": "string"
        }
      },
      "required": [
        "test_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tests_search",
    "description": "Search tests by text (delegates to tests list with search_text)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string"
        },
        "search_text": {
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
        "suite_id": {
          "type": "string"
        },
        "assigned_to": {
          "type": "string"
        },
        "priority": {
          "type": "string"
        },
        "state": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "tests_issues_list",
    "description": "List linked issues for a test (/api/v2/{project_id}/issues?test_id=...)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_id": {
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
        "test_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tests_issues_link",
    "description": "Link issue to a test (/api/v2/{project_id}/issues)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_id": {
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
        "test_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tests_issues_unlink",
    "description": "Unlink issue from a test (/api/v2/{project_id}/issues/{id})",
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
