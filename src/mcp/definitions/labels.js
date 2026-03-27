export const LABELS_TOOLS = [
  {
    "name": "labels_list",
    "description": "List labels (/api/v2/{project_id}/labels)",
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
        "query": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  },
  {
    "name": "labels_get",
    "description": "Get label by slug",
    "inputSchema": {
      "type": "object",
      "properties": {
        "label_id": {
          "type": "string"
        }
      },
      "required": [
        "label_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "labels_create",
    "description": "Create label (/api/v2/{project_id}/labels)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "color": {
          "type": "string"
        },
        "visibility": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "filter",
              "list"
            ]
          }
        },
        "scope": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "tests",
              "suites",
              "runs",
              "plans",
              "steps",
              "templates"
            ]
          }
        },
        "field": {
          "type": "object"
        }
      },
      "required": [
        "title"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "labels_update",
    "description": "Update label (/api/v2/{project_id}/labels/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "label_id": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "color": {
          "type": "string"
        },
        "visibility": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "filter",
              "list"
            ]
          }
        },
        "scope": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "tests",
              "suites",
              "runs",
              "plans",
              "steps",
              "templates"
            ]
          }
        },
        "field": {
          "type": "object"
        }
      },
      "required": [
        "label_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "labels_delete",
    "description": "Delete label (/api/v2/{project_id}/labels/{id})",
    "inputSchema": {
      "type": "object",
      "properties": {
        "label_id": {
          "type": "string"
        }
      },
      "required": [
        "label_id"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "labels_search",
    "description": "Search labels (delegates to labels list; docs has no dedicated search parameter)",
    "inputSchema": {
      "type": "object",
      "properties": {
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
  }
];
