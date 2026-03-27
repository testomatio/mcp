export const TESTRUNS_TOOLS = [
  {
    "name": "testruns_list",
    "description": "List testruns (/api/v2/{project_id}/testruns)",
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
        "run_id": {
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
    "name": "testruns_get",
    "description": "Get testrun by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "testrun_id": {
          "type": "integer"
        }
      },
      "required": [
        "testrun_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "testruns_create",
    "description": "Create testrun (/api/v2/{project_id}/testruns)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
          "type": "string"
        },
        "test_id": {
          "type": "string"
        },
        "status": {
          "type": "string"
        },
        "message": {
          "type": "string"
        },
        "run_time": {
          "type": "number"
        },
        "assigned_to": {
          "type": "string"
        },
        "test_title": {
          "type": "string"
        },
        "automated": {
          "type": "boolean"
        }
      },
      "required": [
        "run_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "testruns_update",
    "description": "Update testrun (/api/v2/{project_id}/testruns/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "testrun_id": {
          "type": "integer"
        },
        "run_id": {
          "type": "string"
        },
        "test_id": {
          "type": "string"
        },
        "status": {
          "type": "string"
        },
        "message": {
          "type": "string"
        },
        "run_time": {
          "type": "number"
        },
        "assigned_to": {
          "type": "string"
        },
        "test_title": {
          "type": "string"
        },
        "automated": {
          "type": "boolean"
        }
      },
      "required": [
        "testrun_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "testruns_delete",
    "description": "Delete testrun (/api/v2/{project_id}/testruns/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "testrun_id": {
          "type": "integer"
        }
      },
      "required": [
        "testrun_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "testruns_search",
    "description": "Search testruns (delegates to testruns list; docs has no dedicated search parameter)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
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
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "testruns_issues_list",
    "description": "List linked issues for a testrun (/api/v2/{project_id}/issues?testrun_id=...)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "testrun_id": {
          "type": "integer"
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
        "testrun_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "testruns_issues_link",
    "description": "Link issue to a testrun (/api/v2/{project_id}/issues)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "testrun_id": {
          "type": "integer"
        },
        "url": {
          "type": "string"
        },
        "jira_id": {
          "type": "string"
        }
      },
      "required": [
        "testrun_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "testruns_issues_unlink",
    "description": "Unlink issue from a testrun (/api/v2/{project_id}/issues/{id})",
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
