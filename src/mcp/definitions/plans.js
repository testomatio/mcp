import { PLANS_TQL_INPUT_DESCRIPTION, PLANS_TQL_REFERENCE } from './tql-reference.js';

export const PLANS_TOOLS = [
  {
    "name": "plans_list",
    "description": "List plans (/api/v2/{project_id}/plans)",
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
        "kind": {
          "type": "string",
          "enum": [
            "manual",
            "automated",
            "mixed"
          ]
        },
        "hidden": {
          "type": "boolean"
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "search_text": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "plans_get",
    "description": "Get plan by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "plan_id": {
          "type": "string"
        }
      },
      "required": [
        "plan_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "plans_create",
    "description": `Create plan (/api/v2/{project_id}/plans). ${PLANS_TQL_REFERENCE}`,
    "inputSchema": {
      "type": "object",
      "properties": {
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
        "hidden": {
          "type": "boolean"
        },
        "as_manual": {
          "type": "boolean"
        },
        "test_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of test IDs (8-char) to include in the plan. If omitted, all tests matching the plan kind are included."
        },
        "suite_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of suite IDs (8-char) to include in the plan. If omitted, all suites are considered."
        },
        "tql": {
          "type": "string",
          "description": PLANS_TQL_INPUT_DESCRIPTION
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
    "name": "plans_update",
    "description": `Update plan (/api/v2/{project_id}/plans/{id}). ${PLANS_TQL_REFERENCE}`,
    "inputSchema": {
      "type": "object",
      "properties": {
        "plan_id": {
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
        "hidden": {
          "type": "boolean"
        },
        "as_manual": {
          "type": "boolean"
        },
        "test_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of test IDs (8-char) to include in the plan. If omitted, all tests matching the plan kind are included."
        },
        "suite_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of suite IDs (8-char) to include in the plan. If omitted, all suites are considered."
        },
        "tql": {
          "type": "string",
          "description": PLANS_TQL_INPUT_DESCRIPTION
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
        "plan_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "plans_delete",
    "description": "Delete plan",
    "inputSchema": {
      "type": "object",
      "properties": {
        "plan_id": {
          "type": "string"
        }
      },
      "required": [
        "plan_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "plans_search",
    "description": "Search plans (delegates to plans list; docs has no dedicated search parameter)",
    "inputSchema": {
      "type": "object",
      "properties": {
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
        "kind": {
          "type": "string",
          "enum": [
            "manual",
            "automated",
            "mixed"
          ]
        },
        "hidden": {
          "type": "boolean"
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "plans_issues_list",
    "description": "List linked issues for a plan (/api/v2/{project_id}/issues?plan_id=...)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "plan_id": {
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
        "plan_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "plans_issues_link",
    "description": "Link issue to a plan (/api/v2/{project_id}/issues)",
    "inputSchema": {
      "type": "object",
      "properties": {
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
      "required": [
        "plan_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "plans_issues_unlink",
    "description": "Unlink issue from a plan (/api/v2/{project_id}/issues/{id})",
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
