import { RUNS_TQL_INPUT_DESCRIPTION, RUNS_TQL_REFERENCE } from './tql-reference.js';
import { BRANCH_PARAM } from './branches.js';

export const RUNS_TOOLS = [
  {
    "name": "runs_list",
    "description": `List runs (/api/v2/{project_id}/runs). ${RUNS_TQL_REFERENCE}`,
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
        "tql": {
          "type": "string",
          "description": RUNS_TQL_INPUT_DESCRIPTION
        },
        "branch": BRANCH_PARAM
      },
      "additionalProperties": false
    }
  },
  {
    "name": "runs_get",
    "description": "Get run by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
          "type": "string"
        },
        "branch": BRANCH_PARAM
      },
      "required": [
        "run_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "runs_stats",
    "description": "Break down one run's testruns by suite, tag, label, assignee, or priority (/api/v2/{project_id}/runs/{id}/stats/{dimension}). Each row has passed_count, failed_count, skipped_count, pending_count for its group — answers \"which areas/owners are affected by this run's failures\". Paginated with a fixed page size; meta uses page/perPage/totalCount/totalPages.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
          "type": "string"
        },
        "dimension": {
          "type": "string",
          "enum": [
            "suites",
            "tags",
            "labels",
            "assignees",
            "priorities"
          ]
        },
        "page": {
          "type": "integer",
          "minimum": 1
        },
        "sort_field": {
          "type": "string",
          "description": "Column to sort by, e.g. failed_count."
        },
        "sort_direction": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ]
        }
      },
      "required": [
        "run_id",
        "dimension"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "runs_create",
    "description": "Create run (/api/v2/{project_id}/runs)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "plan_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "kind": {
          "type": "string",
          "enum": [
            "manual",
            "automated",
            "mixed"
          ]
        },
        "rungroup_id": {
          "type": "string"
        },
        "env": {
          "type": "string"
        },
        "assigned_to": {
          "type": "string"
        },
        "assign_strategy": {
          "type": "string",
          "enum": [
            "test",
            "random",
            "none"
          ]
        },
        "test_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "suite_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "envs": {
          "type": "array",
          "items": {
            "type": "string"
          }
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
        },
        "branch": BRANCH_PARAM
      },
      "required": [
        "title"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "runs_update",
    "description": "Update run (/api/v2/{project_id}/runs/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "kind": {
          "type": "string",
          "enum": [
            "manual",
            "automated",
            "mixed"
          ]
        },
        "rungroup_id": {
          "type": "string"
        },
        "env": {
          "type": "string"
        },
        "status_event": {
          "type": "string",
          "enum": [
            "finish",
            "finish_manual",
            "launch",
            "rerun",
            "scheduled",
            "terminate"
          ]
        },
        "assigned_to": {
          "type": "string"
        },
        "assign_strategy": {
          "type": "string",
          "enum": [
            "test",
            "random",
            "none"
          ]
        },
        "test_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "suite_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
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
        },
        "branch": BRANCH_PARAM
      },
      "required": [
        "run_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "runs_delete",
    "description": "Delete run (/api/v2/{project_id}/runs/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
          "type": "string"
        },
        "branch": BRANCH_PARAM
      },
      "required": [
        "run_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "runs_issues_list",
    "description": "List linked issues for a run (/api/v2/{project_id}/issues?run_id=...)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
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
        "run_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "runs_issues_link",
    "description": "Link issue to a run (/api/v2/{project_id}/issues)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "run_id": {
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
        "run_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "runs_issues_unlink",
    "description": "Unlink issue from a run (/api/v2/{project_id}/issues/{id})",
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
