export const SHARES_TOOLS = [
  {
    "name": "tests_share",
    "description": "Share tests into a suite of another project (/api/v2/{project_id}/shares/tests). Select tests by test_ids, labels, or both (combined). The source project stays the single source of truth; shared copies in the target project are read-only until unlinked. Re-sharing into the same target project does not duplicate. Requests are processed asynchronously: status 'queued' means accepted, not completed. Matched tests that are themselves shared copies are skipped and listed in skipped_test_ids. Source and target projects must be of the same type (Classic/BDD).",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Test IDs to share. At least one of test_ids/labels is required. Max 1000 tests per request."
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Label slugs or titles; every test carrying any of these labels is shared, in addition to test_ids."
        },
        "target_project_id": {
          "type": "string",
          "description": "Project ID (slug) of the destination project. Must be accessible to the current user."
        },
        "target_suite_id": {
          "type": "string",
          "description": "Suite ID in the target project to place the shared tests into. Must be a file-type suite, not a folder."
        }
      },
      "required": [
        "target_project_id",
        "target_suite_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "suites_share",
    "description": "Share suites (with their tests) into one or more other projects (/api/v2/{project_id}/shares/suites). Select suites by suite_ids, labels, or both (combined). File-type suites are linked (read-only copies that stay in sync); folder suites are deep-copied as regular editable copies. Re-sharing a linked suite into a project that already has it does not duplicate. Suites that are themselves shared copies link to their original source. Omit destination_folder_id to share into the root of the target project(s). Requests are processed asynchronously: status 'queued' means accepted, not completed. Source and target projects must be of the same type (Classic/BDD).",
    "inputSchema": {
      "type": "object",
      "properties": {
        "suite_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Suite IDs to share. At least one of suite_ids/labels is required. Max 200 suites per request."
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Label slugs or titles; every suite carrying any of these labels is shared, in addition to suite_ids."
        },
        "target_project_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Project IDs (slugs) of the destination projects. Must be accessible to the current user."
        },
        "destination_folder_id": {
          "type": "string",
          "description": "Folder suite ID in the target project to place the shared suites into. Only allowed when sharing to a single target project."
        }
      },
      "required": [
        "target_project_ids"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "tests_unshare",
    "description": "Remove a test's share, converting the shared copy back into a regular, editable test (/api/v2/{project_id}/shares/tests/{id}). Only the shared copy can be targeted — the original source test is untouched. Must be called against the project that holds the shared copy.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "test_id": {
          "type": "string",
          "description": "ID of the shared test copy to unlink."
        }
      },
      "required": [
        "test_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "suites_unshare",
    "description": "Remove a suite's share, converting the shared copy back into a regular, editable suite (/api/v2/{project_id}/shares/suites/{id}). Only the shared (linked) copy can be targeted — the original source suite is untouched. Must be called against the project that holds the shared copy.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "suite_id": {
          "type": "string",
          "description": "ID of the shared suite copy to unlink."
        }
      },
      "required": [
        "suite_id"
      ],
      "additionalProperties": false
    }
  }
];
