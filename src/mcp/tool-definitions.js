const ISSUE_RESOURCE_PROPERTIES = {
  test_id: { type: 'string' },
  suite_id: { type: 'string' },
  run_id: { type: 'string' },
  testrun_id: { type: 'integer' },
  plan_id: { type: 'string' },
};

export const TOOL_DEFINITIONS = [
  {
    name: 'system_ping',
    description: 'Check server status and active configuration',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'tests_list',
    description: 'List tests (/api/v2/{project_id}/tests)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        suite_id: { type: 'string' },
        search_text: { type: 'string' },
        query: { type: 'string' },
        assigned_to: { type: 'string' },
        priority: { type: 'string' },
        state: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'tests_get',
    description: 'Get test by ID',
    inputSchema: {
      type: 'object',
      properties: {
        test_id: { type: 'string' },
      },
      required: ['test_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'tests_create',
    description: 'Create test (/api/v2/{project_id}/tests)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        suite_id: { type: 'string' },
        description: { type: 'string' },
        emoji: { type: 'string' },
        priority: { type: 'string' },
        assigned_to: { type: 'string' },
        code: { type: 'string' },
        state: { type: 'string' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['title', 'suite_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'tests_update',
    description: 'Update test (/api/v2/{project_id}/tests/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        test_id: { type: 'string' },
        title: { type: 'string' },
        suite_id: { type: 'string' },
        description: { type: 'string' },
        emoji: { type: 'string' },
        priority: { type: 'string' },
        assigned_to: { type: 'string' },
        code: { type: 'string' },
        state: { type: 'string' },
        sync: { type: 'boolean' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['test_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'tests_delete',
    description: 'Delete test',
    inputSchema: {
      type: 'object',
      properties: {
        test_id: { type: 'string' },
      },
      required: ['test_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'tests_search',
    description: 'Search tests by text (delegates to tests list with search_text)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        search_text: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        suite_id: { type: 'string' },
        assigned_to: { type: 'string' },
        priority: { type: 'string' },
        state: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'tests_issues_list',
    description: 'List linked issues for a test (/api/v2/{project_id}/issues?test_id=...)',
    inputSchema: {
      type: 'object',
      properties: {
        test_id: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        source: { type: 'string' },
      },
      required: ['test_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'tests_issues_link',
    description: 'Link issue to a test (/api/v2/{project_id}/issues)',
    inputSchema: {
      type: 'object',
      properties: {
        test_id: { type: 'string' },
        url: { type: 'string' },
        jira_id: { type: 'string' },
      },
      required: ['test_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'tests_issues_unlink',
    description: 'Unlink issue from a test (/api/v2/{project_id}/issues/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'integer' },
        type: { type: 'string', enum: ['issue', 'jira_issue'] },
      },
      required: ['issue_id', 'type'],
      additionalProperties: false,
    },
  },
  {
    name: 'suites_list',
    description: 'List suites as tree (/api/v2/{project_id}/suites)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        file_type: { type: 'string', enum: ['file', 'folder'] },
        tag: { type: 'string' },
        labels: { type: 'string' },
        search_text: { type: 'string' },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'suites_get',
    description: 'Get suite by ID',
    inputSchema: {
      type: 'object',
      properties: {
        suite_id: { type: 'string' },
      },
      required: ['suite_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'suites_create',
    description: 'Create suite (/api/v2/{project_id}/suites)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        emoji: { type: 'string' },
        parent_id: { type: 'string' },
        file_type: { type: 'string' },
        assigned_to: { type: 'string' },
        file: { type: 'string' },
        children: { type: 'array' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'suites_update',
    description: 'Update suite (/api/v2/{project_id}/suites/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        suite_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        emoji: { type: 'string' },
        parent_id: { type: 'string' },
        file_type: { type: 'string' },
        assigned_to: { type: 'string' },
        file: { type: 'string' },
        children: { type: 'array' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['suite_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'suites_delete',
    description: 'Delete suite',
    inputSchema: {
      type: 'object',
      properties: {
        suite_id: { type: 'string' },
      },
      required: ['suite_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'suites_search',
    description: 'Search suites by title (delegates to suites list with search_text)',
    inputSchema: {
      type: 'object',
      properties: {
        search_text: { type: 'string' },
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        file_type: { type: 'string', enum: ['file', 'folder'] },
        tag: { type: 'string' },
        labels: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'suites_issues_list',
    description: 'List linked issues for a suite (/api/v2/{project_id}/issues?suite_id=...)',
    inputSchema: {
      type: 'object',
      properties: {
        suite_id: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        source: { type: 'string' },
      },
      required: ['suite_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'suites_issues_link',
    description: 'Link issue to a suite (/api/v2/{project_id}/issues)',
    inputSchema: {
      type: 'object',
      properties: {
        suite_id: { type: 'string' },
        url: { type: 'string' },
        jira_id: { type: 'string' },
      },
      required: ['suite_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'suites_issues_unlink',
    description: 'Unlink issue from a suite (/api/v2/{project_id}/issues/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'integer' },
        type: { type: 'string', enum: ['issue', 'jira_issue'] },
      },
      required: ['issue_id', 'type'],
      additionalProperties: false,
    },
  },
  {
    name: 'runs_list',
    description: 'List runs (/api/v2/{project_id}/runs)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'runs_get',
    description: 'Get run by ID',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
      },
      required: ['run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'runs_create',
    description: 'Create run (/api/v2/{project_id}/runs)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        plan_id: { type: 'string' },
        kind: { type: 'string', enum: ['manual', 'automated', 'mixed'] },
        rungroup_id: { type: 'string' },
        env: { type: 'string' },
        assigned_to: { type: 'string' },
        assign_strategy: { type: 'string', enum: ['test', 'random', 'none'] },
        test_ids: { type: 'array', items: { type: 'string' } },
        envs: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'runs_update',
    description: 'Update run (/api/v2/{project_id}/runs/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        plan_id: { type: 'string' },
        kind: { type: 'string', enum: ['manual', 'automated', 'mixed'] },
        rungroup_id: { type: 'string' },
        env: { type: 'string' },
        status_event: {
          type: 'string',
          enum: ['finish', 'finish_manual', 'launch', 'rerun', 'scheduled', 'terminate'],
        },
        assigned_to: { type: 'string' },
        assign_strategy: { type: 'string', enum: ['test', 'random', 'none'] },
        test_ids: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'runs_delete',
    description: 'Delete run (/api/v2/{project_id}/runs/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
      },
      required: ['run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'runs_search',
    description: 'Search runs (delegates to runs list; docs has no dedicated search parameter)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'runs_issues_list',
    description: 'List linked issues for a run (/api/v2/{project_id}/issues?run_id=...)',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        source: { type: 'string' },
      },
      required: ['run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'runs_issues_link',
    description: 'Link issue to a run (/api/v2/{project_id}/issues)',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
        url: { type: 'string' },
        jira_id: { type: 'string' },
      },
      required: ['run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'runs_issues_unlink',
    description: 'Unlink issue from a run (/api/v2/{project_id}/issues/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'integer' },
        type: { type: 'string', enum: ['issue', 'jira_issue'] },
      },
      required: ['issue_id', 'type'],
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_list',
    description: 'List testruns (/api/v2/{project_id}/testruns)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        run_id: { type: 'string' },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_get',
    description: 'Get testrun by ID',
    inputSchema: {
      type: 'object',
      properties: {
        testrun_id: { type: 'integer' },
      },
      required: ['testrun_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_create',
    description: 'Create testrun (/api/v2/{project_id}/testruns)',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
        test_id: { type: 'string' },
        status: { type: 'string' },
        message: { type: 'string' },
        run_time: { type: 'number' },
        assigned_to: { type: 'string' },
        test_title: { type: 'string' },
        automated: { type: 'boolean' },
      },
      required: ['run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_update',
    description: 'Update testrun (/api/v2/{project_id}/testruns/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        testrun_id: { type: 'integer' },
        run_id: { type: 'string' },
        test_id: { type: 'string' },
        status: { type: 'string' },
        message: { type: 'string' },
        run_time: { type: 'number' },
        assigned_to: { type: 'string' },
        test_title: { type: 'string' },
        automated: { type: 'boolean' },
      },
      required: ['testrun_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_delete',
    description: 'Delete testrun (/api/v2/{project_id}/testruns/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        testrun_id: { type: 'integer' },
      },
      required: ['testrun_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_search',
    description: 'Search testruns (delegates to testruns list; docs has no dedicated search parameter)',
    inputSchema: {
      type: 'object',
      properties: {
        run_id: { type: 'string' },
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_issues_list',
    description: 'List linked issues for a testrun (/api/v2/{project_id}/issues?testrun_id=...)',
    inputSchema: {
      type: 'object',
      properties: {
        testrun_id: { type: 'integer' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        source: { type: 'string' },
      },
      required: ['testrun_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_issues_link',
    description: 'Link issue to a testrun (/api/v2/{project_id}/issues)',
    inputSchema: {
      type: 'object',
      properties: {
        testrun_id: { type: 'integer' },
        url: { type: 'string' },
        jira_id: { type: 'string' },
      },
      required: ['testrun_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'testruns_issues_unlink',
    description: 'Unlink issue from a testrun (/api/v2/{project_id}/issues/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'integer' },
        type: { type: 'string', enum: ['issue', 'jira_issue'] },
      },
      required: ['issue_id', 'type'],
      additionalProperties: false,
    },
  },
  {
    name: 'rungroups_list',
    description: 'List run groups as tree (/api/v2/{project_id}/rungroups)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'rungroups_get',
    description: 'Get run group by ID',
    inputSchema: {
      type: 'object',
      properties: {
        rungroup_id: { type: 'string' },
      },
      required: ['rungroup_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'rungroups_create',
    description: 'Create run group (/api/v2/{project_id}/rungroups)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        emoji: { type: 'string' },
        kind: { type: 'string' },
        pin: { type: 'boolean' },
        status: { type: 'string' },
        parent_id: { type: 'string' },
        children: { type: 'array' },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'rungroups_update',
    description: 'Update run group (/api/v2/{project_id}/rungroups/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        rungroup_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        emoji: { type: 'string' },
        kind: { type: 'string' },
        pin: { type: 'boolean' },
        status: { type: 'string' },
        parent_id: { type: 'string' },
        children: { type: 'array' },
      },
      required: ['rungroup_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'rungroups_delete',
    description: 'Delete run group (/api/v2/{project_id}/rungroups/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        rungroup_id: { type: 'string' },
      },
      required: ['rungroup_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'rungroups_search',
    description: 'Search run groups (delegates to rungroups list; docs has no dedicated search parameter)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'steps_list',
    description: 'List steps (/api/v2/{project_id}/steps)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'steps_get',
    description: 'Get step by ID',
    inputSchema: {
      type: 'object',
      properties: {
        step_id: { type: 'integer' },
      },
      required: ['step_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'steps_create',
    description: 'Create step (/api/v2/{project_id}/steps)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'steps_update',
    description: 'Update step (/api/v2/{project_id}/steps/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        step_id: { type: 'integer' },
        title: { type: 'string' },
        description: { type: 'string' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['step_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'steps_delete',
    description: 'Delete step (/api/v2/{project_id}/steps/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        step_id: { type: 'integer' },
      },
      required: ['step_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'steps_search',
    description: 'Search steps (delegates to steps list; docs has no dedicated search parameter)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'snippets_list',
    description: 'List snippets (/api/v2/{project_id}/snippets)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'snippets_get',
    description: 'Get snippet by ID',
    inputSchema: {
      type: 'object',
      properties: {
        snippet_id: { type: 'integer' },
      },
      required: ['snippet_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'snippets_create',
    description: 'Create snippet (/api/v2/{project_id}/snippets)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'snippets_update',
    description: 'Update snippet (/api/v2/{project_id}/snippets/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        snippet_id: { type: 'integer' },
        title: { type: 'string' },
        description: { type: 'string' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['snippet_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'snippets_delete',
    description: 'Delete snippet (/api/v2/{project_id}/snippets/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        snippet_id: { type: 'integer' },
      },
      required: ['snippet_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'snippets_search',
    description: 'Search snippets (delegates to snippets list; docs has no dedicated search parameter)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'labels_list',
    description: 'List labels (/api/v2/{project_id}/labels)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'labels_get',
    description: 'Get label by slug',
    inputSchema: {
      type: 'object',
      properties: {
        label_id: { type: 'string' },
      },
      required: ['label_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'labels_create',
    description: 'Create label (/api/v2/{project_id}/labels)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        color: { type: 'string' },
        visibility: {
          type: 'array',
          items: { type: 'string', enum: ['filter', 'list'] },
        },
        scope: {
          type: 'array',
          items: { type: 'string', enum: ['tests', 'suites', 'runs', 'plans', 'steps', 'templates'] },
        },
        field: { type: 'object' },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'labels_update',
    description: 'Update label (/api/v2/{project_id}/labels/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        label_id: { type: 'string' },
        title: { type: 'string' },
        color: { type: 'string' },
        visibility: {
          type: 'array',
          items: { type: 'string', enum: ['filter', 'list'] },
        },
        scope: {
          type: 'array',
          items: { type: 'string', enum: ['tests', 'suites', 'runs', 'plans', 'steps', 'templates'] },
        },
        field: { type: 'object' },
      },
      required: ['label_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'labels_delete',
    description: 'Delete label (/api/v2/{project_id}/labels/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        label_id: { type: 'string' },
      },
      required: ['label_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'labels_search',
    description: 'Search labels (delegates to labels list; docs has no dedicated search parameter)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'tags_list',
    description: 'List tags with counts (/api/v2/{project_id}/tags)',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'tags_get',
    description: 'Get tests by tag title (/api/v2/{project_id}/tags/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        tag_id: { type: 'string' },
      },
      required: ['tag_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'tags_search',
    description: 'Search by tag title (delegates to tags_get)',
    inputSchema: {
      type: 'object',
      properties: {
        tag_id: { type: 'string' },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'issues_list',
    description: 'List linked issues (/api/v2/{project_id}/issues)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        ...ISSUE_RESOURCE_PROPERTIES,
        source: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'issues_create',
    description: 'Link issue to resource (/api/v2/{project_id}/issues)',
    inputSchema: {
      type: 'object',
      properties: {
        ...ISSUE_RESOURCE_PROPERTIES,
        url: { type: 'string' },
        jira_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'issues_delete',
    description: 'Unlink issue (/api/v2/{project_id}/issues/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'integer' },
        type: { type: 'string', enum: ['issue', 'jira_issue'] },
      },
      required: ['issue_id', 'type'],
      additionalProperties: false,
    },
  },
  {
    name: 'issues_search',
    description: 'Search issues (delegates to issues_list filters)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        ...ISSUE_RESOURCE_PROPERTIES,
        source: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'plans_list',
    description: 'List plans (/api/v2/{project_id}/plans)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        query: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'plans_get',
    description: 'Get plan by ID',
    inputSchema: {
      type: 'object',
      properties: {
        plan_id: { type: 'string' },
      },
      required: ['plan_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'plans_create',
    description: 'Create plan (/api/v2/{project_id}/plans)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        kind: { type: 'string', enum: ['manual', 'automated', 'mixed'] },
        hidden: { type: 'boolean' },
        as_manual: { type: 'boolean' },
        test_plan: { type: 'object' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'plans_update',
    description: 'Update plan (/api/v2/{project_id}/plans/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        plan_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        kind: { type: 'string', enum: ['manual', 'automated', 'mixed'] },
        hidden: { type: 'boolean' },
        as_manual: { type: 'boolean' },
        test_plan: { type: 'object' },
        link: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'remove'] },
              type: {
                type: 'string',
                enum: ['label', 'custom_field', 'tag', 'issue', 'jira'],
              },
              value: { type: 'string' },
            },
            required: ['action', 'type', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['plan_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'plans_delete',
    description: 'Delete plan',
    inputSchema: {
      type: 'object',
      properties: {
        plan_id: { type: 'string' },
      },
      required: ['plan_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'plans_search',
    description: 'Search plans (delegates to plans list; docs has no dedicated search parameter)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'plans_issues_list',
    description: 'List linked issues for a plan (/api/v2/{project_id}/issues?plan_id=...)',
    inputSchema: {
      type: 'object',
      properties: {
        plan_id: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        per_page: { type: 'integer', minimum: 1, maximum: 100 },
        source: { type: 'string' },
      },
      required: ['plan_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'plans_issues_link',
    description: 'Link issue to a plan (/api/v2/{project_id}/issues)',
    inputSchema: {
      type: 'object',
      properties: {
        plan_id: { type: 'string' },
        url: { type: 'string' },
        jira_id: { type: 'string' },
      },
      required: ['plan_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'plans_issues_unlink',
    description: 'Unlink issue from a plan (/api/v2/{project_id}/issues/{id})',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'integer' },
        type: { type: 'string', enum: ['issue', 'jira_issue'] },
      },
      required: ['issue_id', 'type'],
      additionalProperties: false,
    },
  },
];
