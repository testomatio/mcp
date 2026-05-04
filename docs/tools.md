# Tools Reference

Complete reference for all 80+ MCP tools available in the Testomat.io MCP Server.

## Table of Contents

- [System Tools](#system-tools)
- [Test Management](#test-management)
- [Suite Management](#suite-management)
- [Run Management](#run-management)
- [TestRun Management](#testrun-management)
- [Plan Management](#plan-management)
- [RunGroup Management](#rungroup-management)
- [Step Management](#step-management)
- [Snippet Management](#snippet-management)
- [Label Management](#label-management)
- [Tag Management](#tag-management)
- [Milestone Management](#milestone-management)
- [Issue Management](#issue-management)
- [Enterprise Analytics](#enterprise-analytics)
- [Requirement Management](#requirement-management)

---

## System Tools

### system_ping

Check server status and active configuration.

**Usage:** Verify connectivity and configuration

**Parameters:** None

**Returns:**
```json
{
  "status": "ok",
  "projectId": "your-project-id",
  "baseUrl": "https://app.testomat.io",
  "apiVersion": "v2"
}
```

---

## Test Management

### tests_list

List all tests in the project with filtering.

Use `tql` for search/filtering.
TQL means `Testomat.io Query Language`.
Use standard TQL syntax such as `==`, `!=`, `in [...]`, `%`, `and`, `or`, `not`, and parentheses.
For the full syntax and field reference, see the official docs: https://docs.testomat.io/advanced/tql/

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number (min: 1) |
| per_page | integer | No | Items per page (min: 1, max: 100) |
| tql | string | No | TQL filter for tests. Examples: `priority == 'high'`, `state == 'automated'`, `suite % 'Checkout'` |

**Example:**
```json
{
  "name": "tests_list",
  "arguments": {
    "page": 1,
    "per_page": 50,
    "tql": "priority == 'high'"
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/tests`

---

### tests_get

Get a specific test by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| test_id | string | Yes | Test ID |

**Example:**
```json
{
  "name": "tests_get",
  "arguments": {
    "test_id": "12345"
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/tests/{id}`

---

### tests_create

Create a new test.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Test title |
| suite_id | string | Yes | Parent suite ID |
| description | string | No | Test description |
| emoji | string | No | Test emoji icon |
| priority | string | No | Test priority |
| assigned_to | string | No | Assignee ID |
| code | string | No | Test code/automation reference |
| state | string | No | Test state |
| link | array | No | Links to labels, tags, milestones, issues, or jira |

**Link Array Format:**
```json
{
  "link": [
    {
      "action": "add|remove",
      "type": "label|custom_field|tag|milestone|issue|jira|requirement",
      "value": "identifier"
    }
  ]
}
```

**Example:**
```json
{
  "name": "tests_create",
  "arguments": {
    "title": "User login test",
    "suite_id": "123",
    "priority": "high",
    "link": [
      { "action": "add", "type": "label", "value": "smoke" },
      { "action": "add", "type": "tag", "value": "auth" }
    ]
  }
}
```

**API Endpoint:** `POST /api/v2/{project_id}/tests`

---

### tests_update

Update an existing test.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| test_id | string | Yes | Test ID |
| title | string | No | New test title |
| suite_id | string | No | New parent suite ID |
| description | string | No | Updated description |
| emoji | string | No | Test emoji |
| priority | string | No | Test priority |
| assigned_to | string | No | Assignee ID |
| code | string | No | Test code |
| state | string | No | Test state |
| sync | boolean | No | Sync with automation |
| link | array | No | Link updates |

**Example:**
```json
{
  "name": "tests_update",
  "arguments": {
    "test_id": "12345",
    "title": "Updated test title",
    "priority": "critical"
  }
}
```

**API Endpoint:** `PUT /api/v2/{project_id}/tests/{id}`

---

### tests_delete

Delete a test.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| test_id | string | Yes | Test ID |

**Example:**
```json
{
  "name": "tests_delete",
  "arguments": {
    "test_id": "12345"
  }
}
```

**API Endpoint:** `DELETE /api/v2/{project_id}/tests/{id}`

---

### tests_search

Search tests (delegates to `tests_list`).

TQL means `Testomat.io Query Language`.
Use standard TQL syntax. For the full syntax and field reference, see the official docs: https://docs.testomat.io/advanced/tql/

**Parameters:** Same as `tests_list`

**Example:**
```json
{
  "name": "tests_search",
  "arguments": {
    "tql": "state == 'automated'",
    "page": 1,
    "per_page": 20
  }
}
```

---

### tests_issues_list

List linked issues for a test.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| test_id | string | Yes | Test ID |
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| source | string | No | Filter by issue source |

**Example:**
```json
{
  "name": "tests_issues_list",
  "arguments": {
    "test_id": "12345"
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/issues?test_id=...`

---

### tests_issues_link

Link an issue to a test.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| test_id | string | Yes | Test ID |
| url | string | No* | Issue URL |
| jira_id | string | No* | Jira issue ID |

*Either url or jira_id required

**Example (Generic Issue):**
```json
{
  "name": "tests_issues_link",
  "arguments": {
    "test_id": "12345",
    "url": "https://jira.example.com/TEST-123"
  }
}
```

**Example (Jira):**
```json
{
  "name": "tests_issues_link",
  "arguments": {
    "test_id": "12345",
    "jira_id": "TEST-123"
  }
}
```

**API Endpoint:** `POST /api/v2/{project_id}/issues`

---

### tests_issues_unlink

Unlink an issue from a test.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| issue_id | integer | Yes | Issue ID |
| type | string | Yes | "issue" or "jira_issue" |

**Example:**
```json
{
  "name": "tests_issues_unlink",
  "arguments": {
    "issue_id": 123,
    "type": "issue"
  }
}
```

**API Endpoint:** `DELETE /api/v2/{project_id}/issues/{id}`

---

## Suite Management

### suites_list

List suites as a tree structure.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| file_type | string | No | "file" or "folder" |
| tag | string | No | Filter by tag |
| labels | string | No | Filter by labels |
| search_text | string | No | Search text |

**API Endpoint:** `GET /api/v2/{project_id}/suites`

---

### suites_get

Get a specific suite by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| suite_id | string | Yes | Suite ID |

**API Endpoint:** `GET /api/v2/{project_id}/suites/{id}`

---

### suites_create

Create a new suite.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Suite title |
| description | string | No | Suite description |
| emoji | string | No | Suite emoji |
| parent_id | string | No | Parent suite ID |
| file_type | string | No | File type |
| assigned_to | string | No | Assignee ID |
| file | string | No | File reference |
| children | array | No | Child suites |
| link | array | No | Links to labels, tags, milestones, issues, jira, or requirements |

**API Endpoint:** `POST /api/v2/{project_id}/suites`

---

### suites_update

Update an existing suite.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| suite_id | string | Yes | Suite ID |
| title | string | No | New title |
| description | string | No | Description |
| emoji | string | No | Emoji |
| parent_id | string | No | Parent suite ID |
| file_type | string | No | File type |
| assigned_to | string | No | Assignee ID |
| file | string | No | File reference |
| children | array | No | Child suites |
| link | array | No | Link updates for labels, tags, milestones, issues, jira, or requirements |

**API Endpoint:** `PUT /api/v2/{project_id}/suites/{id}`

---

### suites_delete

Delete a suite.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| suite_id | string | Yes | Suite ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/suites/{id}`

---

### suites_search

Search suites by title (delegates to suites_list with search_text).

**Parameters:** Similar to `suites_list`

---

### Suite Issue Operations

**suites_issues_list**, **suites_issues_link**, **suites_issues_unlink**

Same pattern as test issue operations, but for suites.

---

## Run Management

### runs_list

List all test runs.

Use `tql` for search/filtering.
TQL means `Testomat.io Query Language`.
Use standard TQL syntax such as `==`, `!=`, `>`, `<`, `>=`, `<=`, `in [...]`, `%`, `and`, `or`, `not`, and parentheses.
For the full syntax and field reference, see the official docs: https://docs.testomat.io/advanced/tql/

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| tql | string | No | TQL filter for runs. Examples: `title % 'Manual tests'`, `plan == '{PLAN_ID}'`, `finished and with_defect` |

**Example:**
```json
{
  "name": "runs_list",
  "arguments": {
    "page": 1,
    "per_page": 10,
    "tql": "failed and has_test_tag == 'regression'"
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/runs`

---

### runs_get

Get a specific run by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| run_id | string | Yes | Run ID |

**API Endpoint:** `GET /api/v2/{project_id}/runs/{id}`

---

### runs_create

Create a new test run.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Run title |
| description | string | No | Run description |
| plan_ids | array | No | List of plan public UIDs to include in the run |
| kind | string | No | "manual", "automated", or "mixed" |
| rungroup_id | string | No | Run group ID |
| env | string | No | Environment name |
| assigned_to | string | No | Assignee ID |
| assign_strategy | string | No | "test", "random", or "none" |
| test_ids | array | No | Array of test public UIDs to include (use ["*"] for all tests) |
| suite_ids | array | No | Array of suite public UIDs whose tests to include |
| envs | array | No | Array of environment names |
| link | array | No | Links to labels, tags, milestones, issues, or jira |

**Example:**
```json
{
  "name": "runs_create",
  "arguments": {
    "title": "Smoke tests - Prod",
    "kind": "automated",
    "env": "production",
    "test_ids": ["123", "456", "789"]
  }
}
```

**Example with suites:**
```json
{
  "name": "runs_create",
  "arguments": {
    "title": "Auth Suite Tests",
    "kind": "automated",
    "suite_ids": ["suite1", "suite2"]
  }
}
```

**API Endpoint:** `POST /api/v2/{project_id}/runs`

---

### runs_update

Update an existing run.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| run_id | string | Yes | Run ID |
| title | string | No | New title |
| description | string | No | Description |
| kind | string | No | Run type |
| rungroup_id | string | No | Run group ID |
| env | string | No | Environment |
| **status_event** | string | No | **"finish"\|"finish_manual"\|"launch"\|"rerun"\|"scheduled"\|"terminate"** |
| assigned_to | string | No | Assignee ID |
| assign_strategy | string | No | Assignment strategy |
| test_ids | array | No | Test public UIDs |
| suite_ids | array | No | Suite public UIDs whose tests to include |
| link | array | No | Link updates for labels, tags, milestones, issues, or jira |

**Status Event Example:**
```json
{
  "name": "runs_update",
  "arguments": {
    "run_id": "12345",
    "status_event": "finish"
  }
}
```

**API Endpoint:** `PUT /api/v2/{project_id}/runs/{id}`

---

### runs_delete

Delete a run.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| run_id | string | Yes | Run ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/runs/{id}`

---

### runs_search

Search runs (delegates to `runs_list`).

TQL means `Testomat.io Query Language`.
Use standard TQL syntax. For the full syntax and field reference, see the official docs: https://docs.testomat.io/advanced/tql/

**Parameters:** Same as `runs_list`

**Example:**
```json
{
  "name": "runs_search",
  "arguments": {
    "tql": "finished and with_defect",
    "page": 1,
    "per_page": 20
  }
}
```

---

### Run Issue Operations

**runs_issues_list**, **runs_issues_link**, **runs_issues_unlink**

Same pattern as test issue operations, but for runs.

---

## TestRun Management

### testruns_list

List test runs (individual test results within a run).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| run_id | string | No | Filter by parent run ID |
| test_ids | array\|string | No | Test IDs; arrays are sent as comma-separated values |
| filter_status | string | No | `passed`, `failed`, `skipped`, `pending` |
| filter_kind | string | No | `manual` or `automated` |
| filter_user | integer\|string | No | Assigned user ID |
| filter_priority | string | No | Test priority |
| filter_substatus | string | No | Custom substatus filter |
| filter_search | string | No | Text search across test title |
| filter_message | boolean | No | Only testruns with a message |
| filter_link | boolean | No | Only testruns with linked issues |
| filter_finished_at_date_range | string | No | ISO date range, comma-separated |
| tags | array\|string | No | Test tags, comma-separated when sent to API |
| labels | array\|string | No | Run labels, comma-separated when sent to API |
| envs | array\|string | No | Run environments, comma-separated when sent to API |
| rungroups | array\|string | No | Rungroup IDs, comma-separated when sent to API |
| defects | string | No | `has_defects` or `without_defects` |

**API Endpoint:** `GET /api/v2/{project_id}/testruns`

---

### testruns_get

Get a specific test run by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| testrun_id | integer | Yes | Test run ID |

**API Endpoint:** `GET /api/v2/{project_id}/testruns/{id}`

---

### testruns_create

Create a new test run result.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| run_id | string | Yes | Parent run ID |
| test_id | string | No | Test ID |
| status | string | No | Test status (passed, failed, skipped, etc.) |
| message | string | No | Status message |
| run_time | number | No | Execution time in seconds |
| assigned_to | string | No | Assignee ID |
| test_title | string | No | Test title |
| automated | boolean | No | Is automated test |

**Example:**
```json
{
  "name": "testruns_create",
  "arguments": {
    "run_id": "12345",
    "test_id": "67890",
    "status": "passed",
    "run_time": 2.5
  }
}
```

**API Endpoint:** `POST /api/v2/{project_id}/testruns`

---

### testruns_update

Update a test run.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| testrun_id | integer | Yes | Test run ID |
| run_id | string | No | Parent run ID |
| test_id | string | No | Test ID |
| status | string | No | Test status |
| message | string | No | Status message |
| run_time | number | No | Execution time |
| assigned_to | string | No | Assignee ID |
| test_title | string | No | Test title |
| automated | boolean | No | Is automated |

**API Endpoint:** `PUT /api/v2/{project_id}/testruns/{id}`

---

### testruns_delete

Delete a test run.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| testrun_id | integer | Yes | Test run ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/testruns/{id}`

---

### testruns_search

Search testruns (delegates to `testruns_list` with the same filters).

---

### TestRun Issue Operations

**testruns_issues_list**, **testruns_issues_link**, **testruns_issues_unlink**

Same pattern as test issue operations, but for testruns.

---

## Plan Management

### plans_list

List test plans.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| kind | string | No | `manual`, `automated`, `mixed` |
| hidden | boolean | No | Filter hidden vs visible plans |
| labels | array | No | Filter by labels (OR logic) |
| search_text | string | No | Plain text search across plan titles |

**API Endpoint:** `GET /api/v2/{project_id}/plans`

---

### plans_get

Get a specific plan by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| plan_id | string | Yes | Plan ID |

**API Endpoint:** `GET /api/v2/{project_id}/plans/{id}`

---

### plans_create

Create a new test plan.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Plan title |
| description | string | No | Plan description |
| kind | string | No | "manual", "automated", or "mixed" |
| hidden | boolean | No | Hide plan |
| as_manual | boolean | No | Treat as manual |
| test_ids | array | No | List of test IDs (8-char) to include |
| suite_ids | array | No | List of suite IDs (8-char) to include |
| tql | string | No | TQL query expression to filter tests for the plan |
| link | array | No | Links to labels, tags, milestones, issues, or jira |

**API Endpoint:** `POST /api/v2/{project_id}/plans`

---

### plans_update

Update an existing plan.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| plan_id | string | Yes | Plan ID |
| title | string | No | New title |
| description | string | No | Description |
| kind | string | No | Plan type |
| hidden | boolean | No | Hidden flag |
| as_manual | boolean | No | Manual flag |
| test_ids | array | No | List of test IDs (8-char) to include |
| suite_ids | array | No | List of suite IDs (8-char) to include |
| tql | string | No | TQL query expression to filter tests for the plan |
| link | array | No | Link updates for labels, tags, milestones, issues, or jira |

**API Endpoint:** `PUT /api/v2/{project_id}/plans/{id}`

---

### plans_delete

Delete a plan.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| plan_id | string | Yes | Plan ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/plans/{id}`

---

### plans_search

Search plans (delegates to `plans_list` with the same filters).

---

### Plan Issue Operations

**plans_issues_list**, **plans_issues_link**, **plans_issues_unlink**

Same pattern as test issue operations, but for plans.

---

## RunGroup Management

### rungroups_list

List run groups as a tree.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |

**API Endpoint:** `GET /api/v2/{project_id}/rungroups`

---

### rungroups_get

Get a specific run group by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| rungroup_id | string | Yes | Run group ID |

**API Endpoint:** `GET /api/v2/{project_id}/rungroups/{id}`

---

### rungroups_create

Create a new run group.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Group title |
| description | string | No | Description |
| emoji | string | No | Emoji icon |
| kind | string | No | Group kind |
| pin | boolean | No | Pin group |
| status | string | No | Group status |
| parent_id | string | No | Parent group ID |
| children | array | No | Child groups |

**API Endpoint:** `POST /api/v2/{project_id}/rungroups`

---

### rungroups_update

Update an existing run group.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| rungroup_id | string | Yes | Run group ID |
| title | string | No | New title |
| description | string | No | Description |
| emoji | string | No | Emoji |
| kind | string | No | Kind |
| pin | boolean | No | Pin flag |
| status | string | No | Status |
| parent_id | string | No | Parent ID |
| children | array | No | Children |

**API Endpoint:** `PUT /api/v2/{project_id}/rungroups/{id}`

---

### rungroups_delete

Delete a run group.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| rungroup_id | string | Yes | Run group ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/rungroups/{id}`

---

## Step Management

### steps_list

List test steps.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |

**API Endpoint:** `GET /api/v2/{project_id}/steps`

---

### steps_get

Get a specific step by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| step_id | integer | Yes | Step ID |

**API Endpoint:** `GET /api/v2/{project_id}/steps/{id}`

---

### steps_create

Create a new step.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Step title |
| description | string | No | Step description |
| link | array | No | Links to labels, tags, milestones, issues, or jira |

**API Endpoint:** `POST /api/v2/{project_id}/steps`

---

### steps_update

Update an existing step.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| step_id | integer | Yes | Step ID |
| title | string | No | New title |
| description | string | No | Description |
| link | array | No | Link updates for labels, tags, milestones, issues, or jira |

**API Endpoint:** `PUT /api/v2/{project_id}/steps/{id}`

---

### steps_delete

Delete a step.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| step_id | integer | Yes | Step ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/steps/{id}`

---

## Snippet Management

### snippets_list

List code snippets.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |

**API Endpoint:** `GET /api/v2/{project_id}/snippets`

---

### snippets_get

Get a specific snippet by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| snippet_id | integer | Yes | Snippet ID |

**API Endpoint:** `GET /api/v2/{project_id}/snippets/{id}`

---

### snippets_create

Create a new snippet.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Snippet title |
| description | string | No | Description |
| link | array | No | Links to labels, tags, milestones, issues, or jira |

**API Endpoint:** `POST /api/v2/{project_id}/snippets`

---

### snippets_update

Update an existing snippet.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| snippet_id | integer | Yes | Snippet ID |
| title | string | No | New title |
| description | string | No | Description |
| link | array | No | Link updates for labels, tags, milestones, issues, or jira |

**API Endpoint:** `PUT /api/v2/{project_id}/snippets/{id}`

---

### snippets_delete

Delete a snippet.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| snippet_id | integer | Yes | Snippet ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/snippets/{id}`

---

## Label Management

### labels_list

List labels.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |

**API Endpoint:** `GET /api/v2/{project_id}/labels`

---

### labels_get

Get a specific label by slug.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| label_id | string | Yes | Label ID/slug |

**API Endpoint:** `GET /api/v2/{project_id}/labels/{id}`

---

### labels_create

Create a new label.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Label title |
| color | string | No | Label color (hex) |
| visibility | array | No | ["filter", "list"] |
| scope | array | No | ["tests", "suites", "runs", "plans", "steps", "templates"] |
| field | object | No | Field configuration |

**API Endpoint:** `POST /api/v2/{project_id}/labels`

---

### labels_update

Update an existing label.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| label_id | string | Yes | Label ID |
| title | string | No | New title |
| color | string | No | Color |
| visibility | array | No | Visibility options |
| scope | array | No | Label scope |
| field | object | No | Field config |

**API Endpoint:** `PUT /api/v2/{project_id}/labels/{id}`

---

### labels_delete

Delete a label.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| label_id | string | Yes | Label ID |

**API Endpoint:** `DELETE /api/v2/{project_id}/labels/{id}`

---

## Tag Management (Read-Only)

### tags_list

List all tags with counts.

**Parameters:** None

**API Endpoint:** `GET /api/v2/{project_id}/tags`

---

### tags_get

Get tests by tag title.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tag_id | string | Yes | Tag title/ID |

**API Endpoint:** `GET /api/v2/{project_id}/tags/{id}`

---

### tags_search

Search by tag title (delegates to tags_get).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tag_id | string | No | Tag ID |
| query | string | No | Search query |

---

## Milestone Management

### milestones_list

List milestones.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| type | string | No | Filter by milestone type title, e.g. `Sprint` or `Release` |
| status | string | No | `created`, `active`, or `closed` |

**API Endpoint:** `GET /api/v2/{project_id}/milestones`

---

### milestones_get

Get a milestone by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| milestone_id | string | Yes | Milestone slug |

**API Endpoint:** `GET /api/v2/{project_id}/milestones/{id}`

---

## Issue Management (Global)

### issues_list

List linked issues (global or filtered by resource).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| test_id | string | No | Filter by test |
| suite_id | string | No | Filter by suite |
| run_id | string | No | Filter by run |
| testrun_id | integer | No | Filter by testrun |
| plan_id | string | No | Filter by plan |
| source | string | No | Filter by source |

**API Endpoint:** `GET /api/v2/{project_id}/issues`

---

### issues_create

Link an issue to a resource.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| test_id | string | No* | Link to test |
| suite_id | string | No* | Link to suite |
| run_id | string | No* | Link to run |
| testrun_id | integer | No* | Link to testrun |
| plan_id | string | No* | Link to plan |
| url | string | No** | Issue URL |
| jira_id | string | No** | Jira issue ID |

*At least one resource ID required
**Either url or jira_id required

**API Endpoint:** `POST /api/v2/{project_id}/issues`

---

### issues_delete

Unlink an issue.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| issue_id | integer | Yes | Issue ID |
| type | string | Yes | "issue" or "jira_issue" |

**API Endpoint:** `DELETE /api/v2/{project_id}/issues/{id}`

---

### issues_search

Search issues (delegates to issues_list with filters).

**Parameters:** Same as `issues_list`

---

## Requirement Management

### requirements_list

List requirements with optional filters.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| source | string | No | Filter by source type: `jira`, `confluence`, `file`, `text` |
| scope | string | No | Filter by scope: `global`, `attached`, `detached`, `without_suites` |

**API Endpoint:** `GET /api/v2/{project_id}/requirements`

---

### requirements_get

Get a requirement by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| requirement_id | string | Yes | Requirement ID (8-char) |

**API Endpoint:** `GET /api/v2/{project_id}/requirements/{id}`

---

### requirements_create

Create a requirement.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Requirement title |
| source_type | string | Yes | `jira`, `confluence`, `file`, or `text` |
| description | string | No | Required for text requirements; must be at least 500 characters |
| details | string | No | Extended details or raw content |
| active | boolean | No | Active flag |
| global | boolean | No | Project-level requirement flag |
| confluence_url | string | No | Required for confluence requirements |
| files | array | No | Local file paths to upload for file requirements |

**API Endpoint:** `POST /api/v2/{project_id}/requirements`

---

### requirements_update

Update a requirement.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| requirement_id | string | Yes | Requirement ID (8-char) |
| title | string | No | New title |
| description | string | No | Text requirement description |
| details | string | No | Extended details or raw content |
| active | boolean | No | Active flag |
| global | boolean | No | Project-level requirement flag |
| files | array | No | Local file paths to upload for file requirements |

**API Endpoint:** `PATCH /api/v2/{project_id}/requirements/{id}`

---

### requirements_delete

Delete a requirement.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| requirement_id | string | Yes | Requirement ID (8-char) |

**API Endpoint:** `DELETE /api/v2/{project_id}/requirements/{id}`

---

### requirements_search

Search requirements by delegating to `requirements_list` with filters.

**Parameters:** Same as `requirements_list`

**Note:** File uploads use local file paths readable by the MCP server process.

---

## Common Patterns

### API Sessions

The MCP server automatically starts a Testomat.io API session before the first mutating request (`POST`, `PUT`, or `DELETE`) and sends the returned session hash as `X-Session-Hash` on subsequent mutating requests. The session is stopped when the MCP server shuts down. Read-only `GET` requests do not start or use sessions.

### Link Parameter Structure

Most entities support linking via the `link` parameter:

```json
{
  "link": [
    {
      "action": "add|remove",
      "type": "label|custom_field|tag|milestone|issue|jira|requirement",
      "value": "identifier"
    }
  ]
}
```

`requirement` is only applicable to suites. Use the requirement ID (8-char) as the link value.

### Pagination

All list operations support:
- `page` (integer, min: 1)
- `per_page` (integer, min: 1, max: 100)

### Issue Linking

Two ways to link issues:
1. **Generic issues** - via `url` parameter
2. **Jira issues** - via `jira_id` parameter

### Search

Search operations typically delegate to list operations with filter parameters.

---

## Enterprise Analytics

Analytics tools are available only in the separate `@testomatio/mcp-enterprise` package. They require the `api_analytics` subscription feature.

### analytics_tests

List tests matching an analytics report.

Use `q` as the TQL filter parameter. The API parameter name is `q`, not `tql`.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| kind | string | Yes | One of: `flaky`, `slow`, `failing`, `evergreen`, `never-executed`, `skipped`, `failures`, `defects`, `issues` |
| q | string | No | TQL filter, for example `priority == 'high' AND tag IN ['@smoke']` |
| days | integer | No | Lookback window in days |
| from | string | No | Inclusive start date in YYYY-MM-DD format |
| to | string | No | Inclusive end date in YYYY-MM-DD format |
| envs | string | No | Comma-separated execution environments |
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| min | number | No | Flaky rate lower bound, only for `flaky` |
| max | number | No | Flaky rate upper bound, only for `flaky` |
| threshold_ms | integer | No | Duration threshold, only for `slow` |
| maturity_days | integer | No | Minimum test age, only for `never-executed` |
| run | string | No | Scope to one run UID, only for `flaky` and `slow` |

**Example:**
```json
{
  "name": "analytics_tests",
  "arguments": {
    "kind": "flaky",
    "q": "priority == 'high'",
    "days": 30,
    "page": 1,
    "per_page": 20
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/analytics/tests/{kind}`

---

### analytics_stats

Fetch an aggregated analytics report.

Use `q` as the TQL filter parameter. The API parameter name is `q`, not `tql`.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| kind | string | Yes | One of: `project-summary`, `runs-summary`, `success-rate-by-date`, `automation-rate-by-date`, `testruns-by-date`, `priority-by-date` |
| q | string | No | TQL filter, for example `tag IN ['@smoke']` |
| days | integer | No | Lookback window in days |
| from | string | No | Inclusive start date in YYYY-MM-DD format |
| to | string | No | Inclusive end date in YYYY-MM-DD format |
| envs | string | No | Comma-separated execution environments |

**Example:**
```json
{
  "name": "analytics_stats",
  "arguments": {
    "kind": "success-rate-by-date",
    "q": "tag IN ['@smoke']",
    "from": "2026-04-01",
    "to": "2026-04-30"
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/analytics/stats/{kind}`
