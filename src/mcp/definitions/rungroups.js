export const RUNGROUPS_TOOLS = [
  {
    "name": "rungroups_list",
    "description": "List run groups as tree (/api/v2/{project_id}/rungroups)",
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
    "name": "rungroups_get",
    "description": "Get run group by ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "rungroup_id": {
          "type": "string"
        }
      },
      "required": [
        "rungroup_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "rungroups_create",
    "description": "Create run group (/api/v2/{project_id}/rungroups)",
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
        "kind": {
          "type": "string"
        },
        "pin": {
          "type": "boolean"
        },
        "status": {
          "type": "string"
        },
        "parent_id": {
          "type": "string"
        },
        "children": {
          "type": "array"
        }
      },
      "required": [
        "title"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "rungroups_update",
    "description": "Update run group (/api/v2/{project_id}/rungroups/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "rungroup_id": {
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
        "kind": {
          "type": "string"
        },
        "pin": {
          "type": "boolean"
        },
        "status": {
          "type": "string"
        },
        "parent_id": {
          "type": "string"
        },
        "children": {
          "type": "array"
        }
      },
      "required": [
        "rungroup_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "rungroups_delete",
    "description": "Delete run group (/api/v2/{project_id}/rungroups/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "rungroup_id": {
          "type": "string"
        }
      },
      "required": [
        "rungroup_id"
      ],
      "additionalProperties": false
    }
  },
];
