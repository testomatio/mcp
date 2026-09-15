export const BRANCH_PARAM = {
  "type": "string",
  "description": "Branch slug to scope the request to (omit or main for the main branch). For tests and suites, a branch-local record is used when it exists, falling back to main; updating/deleting a main-only record forks an isolated copy into the branch. Runs are tagged with the branch (only reachable with the same branch afterwards). Requires the branches feature."
};

export const BRANCHES_TOOLS = [
  {
    "name": "branches_list",
    "description":
      'List project branches (/api/v2/{project_id}/branches). Requires the branches feature (enterprise plan). Use filter[state] / filter[title] to narrow down.',
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
        "filter_state": {
          "type": "string",
          "enum": [
            "active",
            "merged"
          ],
          "description": "Filter by branch state"
        },
        "filter_title": {
          "type": "string",
          "description": "Filter by title (partial substring match)"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "branches_get",
    "description": "Get branch by slug",
    "inputSchema": {
      "type": "object",
      "properties": {
        "branch_id": {
          "type": "string",
          "description": "Branch slug"
        }
      },
      "required": [
        "branch_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "branches_create",
    "description": "Create branch (/api/v2/{project_id}/branches)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Branch title; a slug is generated from it"
        }
      },
      "required": [
        "title"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "branches_update",
    "description": "Update branch title (/api/v2/{project_id}/branches/{slug})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "branch_id": {
          "type": "string",
          "description": "Branch slug"
        },
        "title": {
          "type": "string"
        }
      },
      "required": [
        "branch_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "branches_delete",
    "description": "Delete branch by slug",
    "inputSchema": {
      "type": "object",
      "properties": {
        "branch_id": {
          "type": "string",
          "description": "Branch slug"
        }
      },
      "required": [
        "branch_id"
      ],
      "additionalProperties": false
    }
  }
];
