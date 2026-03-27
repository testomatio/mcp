export const ISSUES_TOOLS = [
  {
    "name": "issues_list",
    "description": "List linked issues (/api/v2/{project_id}/issues)",
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
        "test_id": {
          "type": "string"
        },
        "suite_id": {
          "type": "string"
        },
        "run_id": {
          "type": "string"
        },
        "testrun_id": {
          "type": "integer"
        },
        "plan_id": {
          "type": "string"
        },
        "source": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "issues_create",
    "description": "Link issue to resource (/api/v2/{project_id}/issues)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_id": {
          "type": "string"
        },
        "suite_id": {
          "type": "string"
        },
        "run_id": {
          "type": "string"
        },
        "testrun_id": {
          "type": "integer"
        },
        "plan_id": {
          "type": "string"
        },
        "url": {
          "type": "string"
        },
        "jira_id": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "issues_delete",
    "description": "Unlink issue (/api/v2/{project_id}/issues/{id})",
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
  },
  {
    "name": "issues_search",
    "description": "Search issues (delegates to issues_list filters)",
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
        "test_id": {
          "type": "string"
        },
        "suite_id": {
          "type": "string"
        },
        "run_id": {
          "type": "string"
        },
        "testrun_id": {
          "type": "integer"
        },
        "plan_id": {
          "type": "string"
        },
        "source": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  }
];
