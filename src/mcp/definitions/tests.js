import { TESTS_TQL_INPUT_DESCRIPTION, TESTS_TQL_REFERENCE } from './tql-reference.js';
import { BRANCH_PARAM } from './branches.js';

export const TESTS_TOOLS = [
  {
    "name": "tests_list",
    "description": `List tests (/api/v2/{project_id}/tests). ${TESTS_TQL_REFERENCE}`,
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
          "description": TESTS_TQL_INPUT_DESCRIPTION
        },
        "branch": BRANCH_PARAM
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
        },
        "branch": BRANCH_PARAM
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
          "type": "string",
          "enum": [
            "low",
            "normal",
            "important",
            "high",
            "critical"
          ]
        },
        "assigned_to": {
          "type": "string"
        },
        "code": {
          "type": "string"
        },
        "state": {
          "type": "string",
          "enum": [
            "manual",
            "detached",
            "automated"
          ]
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
          "type": "string",
          "enum": [
            "low",
            "normal",
            "important",
            "high",
            "critical"
          ]
        },
        "assigned_to": {
          "type": "string"
        },
        "code": {
          "type": "string"
        },
        "state": {
          "type": "string",
          "enum": [
            "manual",
            "detached",
            "automated"
          ]
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
        },
        "branch": BRANCH_PARAM
      },
      "required": [
        "test_id"
      ],
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
  },
  {
    "name": "tests_bulk_upsert",
    "description": "Bulk create/update tests from a testomat.io classical tests markdown document (/api/v2/{project_id}/tests). Tests with an id (@T...) in their metadata are updated, tests without id are created. Suites are resolved by id (@S...) or title, and created when missing. Recommended batch size: up to 100 tests per call.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "markdown": {
          "type": "string",
          "description": "Markdown document in the testomat.io classical tests format: suite blocks (<!-- suite ... -->) containing test blocks (<!-- test ... -->), each followed by a title heading and a description. See https://docs.testomat.io/project/import-export/export-tests/classical-tests-markdown-format/"
        },
        "dry_run": {
          "type": "boolean",
          "default": false,
          "description": "Parse the document and report the planned actions without writing anything"
        },
        "create_missing_suites": {
          "type": "boolean",
          "default": true,
          "description": "Create suites that cannot be resolved by id or title. When false, tests of unresolved suites are reported as errors"
        },
        "branch": BRANCH_PARAM
      },
      "required": [
        "markdown"
      ],
      "additionalProperties": false
    }
  }
];
