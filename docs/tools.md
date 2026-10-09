# Tools Reference

Complete reference for the MCP tools available in the Testomat.io MCP Server.

## Calling Convention

Every entity is exposed as **one CLI-style tool** named after the entity (`tests`, `suites`, `runs`, ...). All operations are passed as the required `command` argument, and command params are passed as flat properties next to it:

```json
{
  "name": "tests",
  "arguments": {
    "command": "list",
    "tql": "priority == 'high'"
  }
}
```

- Each param in the tool schema is prefixed with the commands it applies to, e.g. `(get|update|delete) Test ID`.
- An unknown or missing `command` returns an error listing the valid commands for the tool.
- Command-specific required params are validated at runtime with descriptive errors (a flat JSON schema cannot express per-command `required`).
- Command-less singleton tools (`system_ping`, `tql_help`, `project_info`) take no arguments.

## Table of Contents

- [Tool Surface Profiles](#tool-surface-profiles)
- [System Tools](#system-tools)
- [Project Tools](#project-tools)
- [tests](#tests)
- [suites](#suites)
- [runs](#runs)
- [testruns](#testruns)
- [plans](#plans)
- [rungroups](#rungroups)
- [steps](#steps)
- [snippets](#snippets)
- [labels](#labels)
- [tags](#tags)
- [milestones](#milestones)
- [issues](#issues)
- [requirements](#requirements)
- [branches](#branches)
- [Common Patterns](#common-patterns)
- [Enterprise Analytics](#enterprise-analytics)

---

## Tool Surface Profiles

Every exposed tool's schema is sent to the model on each call, so the tool set has a significant token cost. Use the `--tools` flag to expose only a subset — useful for long, token-sensitive sessions.

| Profile | Description |
|---------|-------------|
| `full` (default) | All tools with all commands |
| `core` | Core entities with all commands. Excludes the `steps`, `snippets`, `labels`, `rungroups` tools |
| `read` | Core entities restricted to read-only commands (`list`, `get`, `search`, `stats`, `issues_list`, `attachments_list`) |

```bash
testomatio-mcp --token <PROJECT_TOKEN> --project <PROJECT_ID> --tools core
```

Values are case-insensitive; an unknown value prevents the server from starting. The profile is chosen at launch with `--tools` or the `TESTOMATIO_TOOLS` environment variable and applies to every call in that session. The CLI flag takes precedence when both are set. The reference below documents the full (`full`) set.

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

### tql_help

Full TQL (Testomat.io Query Language) reference — syntax, filter variables (tests + runs), and examples.

**Usage:** Look up TQL syntax and the available filter fields before composing a `tql`/`q` filter for tests, runs, plans, or analytics.

**Parameters:** None

**Returns:** the complete TQL reference (syntax, tests variables, runs variables, examples).

---

## Project Tools

### project_info

Get configuration and metadata for the configured project.

**Parameters:** None

**Returns:** Project title and ID, framework, language, status, repository URL,
timestamps, artifact storage status, environments, labels, tags, subscription,
enabled features, and CI profiles.

**API Endpoint:** `GET /api/v2/{project_id}/info`

---

## tests

Manage tests. `/api/v2/{project_id}/tests`

**Commands:**

| Command | Description | Runtime-required params |
|---------|-------------|------------------------|
| `list` | List tests (tql filter, pagination) | — |
| `get` | Get test by ID | `test_id` |
| `create` | Create test | `title`, `suite_id` |
| `update` | Update test | `test_id` |
| `delete` | Delete test | `test_id` |
| `bulk_upsert` | Bulk create/update tests from a [classical tests markdown](https://docs.testomat.io/project/import-export/export-tests/classical-tests-markdown-format/) document | `markdown` |
| `share` | Share tests into a suite of another project | `target_project_id`, `target_suite_id`, plus a selection (`test_ids` and/or `labels`) |
| `unshare` | Remove a test's share (converts the shared copy back into a regular test) | `test_id` |
| `issues_list` | List linked issues for a test | `test_id` |
| `issues_link` | Link issue to a test | `test_id`, plus exactly one of `url`/`jira_id` |
| `issues_unlink` | Unlink issue from a test | `issue_id`, `type` |
| `attachments_list` | List attachments for a test | `test_id` |
| `attachments_upload` | Upload one attachment to a test | `test_id`, `file_path` |
| `attachments_delete` | Delete attachment from a test | `test_id`, `attachment_id` |

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| test_id | string | get, update, delete, unshare, issues_*, attachments_* | Test ID (for `unshare`: ID of the shared test copy to unlink) |
| title | string | create, update | Test title |
| suite_id | string | create, update | Suite to place the test in |
| description | string | create, update | Test description |
| emoji | string | create, update | Emoji icon |
| priority | string | create, update | `low`, `normal`, `important`, `high`, `critical` |
| assigned_to | string | create, update | Assignee |
| code | string | create, update | Test code |
| state | string | create, update | `manual`, `detached`, `automated` |
| sync | boolean | update | Sync flags |
| link | array | create, update | Link actions, see [Link Parameter Structure](#link-parameter-structure) |
| tql | string | list | TQL filter for tests. Examples: `priority == 'high'`, `state == 'automated'`, `suite % 'Checkout'` |
| markdown | string | bulk_upsert | Markdown document in the testomat.io classical tests format: suite blocks (`<!-- suite ... -->`) containing test blocks (`<!-- test ... -->`), each followed by a title heading and a description |
| dry_run | boolean | bulk_upsert | Parse the document and report the planned actions without writing anything (default: false) |
| create_missing_suites | boolean | bulk_upsert | Create suites that cannot be resolved by id or title (default: true). When false, tests of unresolved suites are reported as errors |
| branch | string | list, get, create, update, delete, bulk_upsert | Branch slug, see [Branch Scoping](#branch-scoping) |
| page / per_page | integer | list, issues_list | Pagination |
| source | string | issues_list | Filter issues by source (e.g. `jira`) |
| url | string | issues_link | Issue URL to link |
| jira_id | string | issues_link | Jira issue key to link (alternative to `url`) |
| issue_id | integer | issues_unlink | ID of the linked issue to remove |
| type | string | issues_unlink | `issue` or `jira_issue` |
| file_path | string | attachments_upload | Local path to the file sent as multipart field `files` |
| attachment_id | string | attachments_delete | ID of the attachment to delete |
| test_ids | string[] | share | Test IDs to share. Max 1000 per request |
| labels | string[] | share | Label slugs/titles; every test carrying any of these labels is shared, in addition to test_ids |
| target_project_id | string | share | Project ID (slug) of the destination project |
| target_suite_id | string | share | Suite ID in the target project (must be a file-type suite) |

**Sharing semantics:** the source project stays the single source of truth; shared copies in the target project are read-only until unlinked. Re-sharing into the same target project does not duplicate. Requests are processed asynchronously — status `queued` means accepted, not completed. Matched tests that are themselves shared copies are skipped and listed in `skipped_test_ids`. Source and target projects must be of the same type (Classic/BDD).

**Examples:**
```json
{
  "name": "tests",
  "arguments": { "command": "list", "page": 1, "per_page": 50, "tql": "priority == 'high'" }
}
```

```json
{
  "name": "tests",
  "arguments": {
    "command": "create",
    "title": "User login test",
    "suite_id": "123",
    "priority": "high"
  }
}
```

```json
{
  "name": "tests",
  "arguments": {
    "command": "share",
    "test_ids": ["be779025", "sgqat108"],
    "target_project_id": "sugar-king",
    "target_suite_id": "e73d559c"
  }
}
```

```json
{
  "name": "tests",
  "arguments": {
    "command": "bulk_upsert",
    "markdown": "<!-- suite\nid: @S380c64db\n-->\n# Login Functionality\n<!-- test\nid: @T12345678\npriority: high\n-->\n# Successful Login\n## Steps\n* Navigate to the login page\n  *Expected*: Login form is displayed\n<!-- test -->\n# Failed Login\n## Steps\n* Enter invalid credentials\n  *Expected*: Error message is displayed"
  }
}
```

**Bulk upsert semantics:** tests with an `id: @T...` in their metadata are updated, tests without an id are created. Suites are resolved by `id: @S...` or title, and created when missing (`create_missing_suites`). Limits are 100 tests and 25 suites per call; documents are sent to the backend in batches of 50. `tags`/`labels` from the markdown are parsed but not applied — the bulk endpoint does not support them; affected calls return a `warnings` list. Per-test failures do not stop the batch: the response contains `stats` (suites created/reused, tests created/updated, errors), `created`/`updated` lists, per-test `errors`, and `warnings`. With `dry_run: true` the document is only parsed and the planned actions reported.

**API Endpoint:** `POST /api/v2/{project_id}/tests/bulk`

---

## suites

Manage suites as a tree. `/api/v2/{project_id}/suites`

**Commands:**

| Command | Description | Runtime-required params |
|---------|-------------|------------------------|
| `list` | List suites as tree (file_type, tag, labels, search_text filters) | — |
| `get` | Get suite by ID | `suite_id` |
| `create` | Create suite | `title` |
| `update` | Update suite | `suite_id` |
| `delete` | Delete suite | `suite_id` |
| `share` | Share suites (with their tests) into one or more other projects | `target_project_ids`, plus a selection (`suite_ids` and/or `labels`) |
| `unshare` | Remove a suite's share (converts the shared copy back into a regular suite) | `suite_id` |
| `issues_list` / `issues_link` / `issues_unlink` | Scoped issue operations | as on `tests` |
| `attachments_list` / `attachments_upload` / `attachments_delete` | Scoped attachment operations | as on `tests` |

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| suite_id | string | get, update, delete, unshare, issues_*, attachments_* | Suite ID (for `unshare`: ID of the shared suite copy to unlink) |
| title | string | create, update | Suite title |
| description | string | create, update | Suite description |
| emoji | string | create, update | Emoji icon |
| parent_id | string | create, update | Parent suite ID |
| file_type | string | list, create, update | `file` or `folder` |
| assigned_to | string | create, update | Assignee |
| file | string | create, update | File reference |
| children | array | create, update | Child items |
| link | array | create, update | Link actions (supports `requirement` type), see [Link Parameter Structure](#link-parameter-structure) |
| tag | string | list | Filter by tag title |
| labels | string \| string[] | list, share | list: filter by labels; share: label selection for sharing |
| search_text | string | list | Text search |
| branch | string | list, get, create, update, delete | Branch slug, see [Branch Scoping](#branch-scoping) |
| page / per_page | integer | list, issues_list | Pagination |
| suite_ids | string[] | share | Suite IDs to share. Max 200 per request |
| target_project_ids | string[] | share | Project IDs (slugs) of the destination projects |
| destination_folder_id | string | share | Folder suite ID in the target project (only allowed when sharing to a single target project) |

**Sharing semantics:** file-type suites are linked (read-only copies that stay in sync); folder suites are deep-copied as regular editable copies. Re-sharing a linked suite into a project that already has it does not duplicate. Suites that are themselves shared copies link to their original source. Omit `destination_folder_id` to share into the root of the target project(s). Requests are processed asynchronously; projects must be of the same type (Classic/BDD).

---

## runs

Manage runs. `/api/v2/{project_id}/runs`

**Commands:**

| Command | Description | Runtime-required params |
|---------|-------------|------------------------|
| `list` | List runs (tql filter, pagination) | — |
| `get` | Get run by ID | `run_id` |
| `create` | Create run | `title` |
| `update` | Update run (status transitions via `status_event`) | `run_id` |
| `delete` | Delete run | `run_id` |
| `stats` | Break down one run's testruns by a dimension (`GET /api/v2/{project_id}/runs/{id}/stats/{dimension}`) | `run_id`, `dimension` |
| `issues_list` / `issues_link` / `issues_unlink` | Scoped issue operations | as on `tests` (with `run_id`) |

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| run_id | string | get, update, delete, stats, issues_list, issues_link | Run ID |
| dimension | string | stats | `suites`, `tags`, `labels`, `assignees`, or `priorities` |
| sort_field | string | stats | Column to sort by, e.g. `failed_count` |
| sort_direction | string | stats | `asc` or `desc` |
| title | string | create, update | Run title |
| description | string | create, update | Run description |
| plan_ids | string[] | create | Plans to include |
| kind | string | create, update | `manual`, `automated`, `mixed` |
| rungroup_id | string | create, update | Run group |
| env | string | create, update | Environment |
| status_event | string | update | `finish`, `finish_manual`, `launch`, `rerun`, `scheduled`, `terminate` |
| assigned_to | string | create, update | Assignee |
| assign_strategy | string | create, update | `test`, `random`, `none` |
| test_ids | string[] | create, update | Tests to include |
| suite_ids | string[] | create, update | Suites to include |
| envs | string[] | create | Environments |
| link | array | create, update | Link actions, see [Link Parameter Structure](#link-parameter-structure) |
| tql | string | list | TQL filter for runs |
| branch | string | list, get, create, update, delete | Branch slug, see [Branch Scoping](#branch-scoping) |
| page / per_page | integer | list, issues_list | Pagination |
| page | integer | stats | Page number (`stats` has a fixed page size, no `per_page`) |

`stats` rows carry `passed_count`, `failed_count`, `skipped_count`, `pending_count` for their group — answers "which areas/owners are affected by this run's failures". `meta` uses `page`/`perPage`/`totalCount`/`totalPages`.

**Example — finish a run:**
```json
{
  "name": "runs",
  "arguments": { "command": "update", "run_id": "456", "status_event": "finish" }
}
```

---

## testruns

Manage individual test runs (result records inside a run). `/api/v2/{project_id}/testruns`

**Commands:**

| Command | Description | Runtime-required params |
|---------|-------------|------------------------|
| `list` | List testruns (rich filters) | — |
| `get` | Get testrun by ID | `testrun_id` |
| `create` | Create testrun in a run | `run_id` |
| `update` | Update testrun | `testrun_id` |
| `delete` | Delete testrun | `testrun_id` |
| `issues_list` / `issues_link` / `issues_unlink` | Scoped issue operations | as on `tests` (with `testrun_id`) |
| `attachments_list` / `attachments_upload` / `attachments_delete` | Scoped attachment operations | as on `tests` (with `testrun_id`) |

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| testrun_id | integer | get, update, delete, issues_*, attachments_* | TestRun ID |
| run_id | string | list, create, update | list: filter by run; create/update: the owning run |
| test_id | string | create, update | Test reference |
| test_ids | string \| string[] | list | Filter by tests |
| sort | string | list | `created_at`, `suite`, `testcase`, or `failure`. Default order is oldest-first — use `created_at` with `order=desc` for the most recent executions |
| order | string | list | `asc` (default) or `desc` |
| status | string | create, update | `passed`, `failed`, `skipped`, `pending` |
| message | string | create, update | Result message |
| run_time | number | create, update | Execution time |
| assigned_to | string | create, update | Assignee |
| test_title | string | create, update | Title override |
| automated | boolean | create, update | Automated flag |
| filter_status | string | list | `passed`, `failed`, `skipped`, `pending` |
| filter_kind | string | list | `manual`, `automated` |
| filter_user | integer \| string | list | Filter by user |
| filter_priority | string | list | `low` … `critical` |
| filter_substatus | string | list | Filter by substatus |
| filter_search | string | list | Text search |
| filter_message | boolean | list | Has message |
| filter_link | boolean | list | Has link |
| filter_finished_at_date_range | string | list | Date range filter |
| tags / labels / envs / rungroups | string \| string[] | list | Filter lists (comma-joined) |
| defects | string | list | `has_defects` / `without_defects` |
| page / per_page | integer | list, issues_list | Pagination |

---

## plans

Manage test plans. `/api/v2/{project_id}/plans`

**Commands:**

| Command | Description | Runtime-required params |
|---------|-------------|------------------------|
| `list` | List plans (kind, hidden, labels, search_text filters) | — |
| `get` | Get plan by ID | `plan_id` |
| `create` | Create plan | `title` |
| `update` | Update plan | `plan_id` |
| `delete` | Delete plan | `plan_id` |
| `issues_list` / `issues_link` / `issues_unlink` | Scoped issue operations | as on `tests` (with `plan_id`) |

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| plan_id | string | get, update, delete, issues_list, issues_link | Plan ID |
| title | string | create, update | Plan title |
| description | string | create, update | Plan description |
| kind | string | list, create, update | `manual`, `automated`, `mixed` |
| hidden | boolean | list, create, update | list: include hidden; create/update: set flag |
| as_manual | boolean | create, update | Create manual testruns |
| labels | string[] | list | Filter by labels |
| search_text | string | list | Text search |
| test_ids | string[] | create, update | Test IDs to include (if omitted, all tests matching the plan kind) |
| suite_ids | string[] | create, update | Suite IDs to include (if omitted, all suites considered) |
| tql | string | create, update | TQL filter selecting plan contents |
| link | array | create, update | Link actions |
| page / per_page | integer | list, issues_list | Pagination |

---

## rungroups

Manage run groups as a tree. `/api/v2/{project_id}/rungroups`

**Commands:** `list`, `get`, `create` (`title`), `update` (`rungroup_id`), `delete` (`rungroup_id`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| rungroup_id | string | get, update, delete | Run group ID |
| title | string | create, update | Title |
| description | string | create, update | Description |
| emoji | string | create, update | Emoji icon |
| kind | string | create, update | Group kind |
| pin | boolean | create, update | Pinned flag |
| status | string | create, update | Status |
| parent_id | string | create, update | Parent group |
| children | array | create, update | Child items |
| page / per_page | integer | list | Pagination |

---

## steps

Manage test steps. `/api/v2/{project_id}/steps`

**Commands:** `list`, `get` (`step_id`), `create` (`title`), `update` (`step_id`), `delete` (`step_id`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| step_id | integer | get, update, delete | Step ID |
| title | string | create, update | Step title |
| description | string | create, update | Step description |
| link | array | create, update | Link actions |
| page / per_page | integer | list | Pagination |

---

## snippets

Manage code snippets. `/api/v2/{project_id}/snippets`

**Commands:** `list`, `get` (`snippet_id`), `create` (`title`), `update` (`snippet_id`), `delete` (`snippet_id`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| snippet_id | integer | get, update, delete | Snippet ID |
| title | string | create, update | Snippet title |
| description | string | create, update | Snippet code/description |
| link | array | create, update | Link actions |
| page / per_page | integer | list | Pagination |

---

## labels

Manage labels. `/api/v2/{project_id}/labels`

**Commands:** `list`, `get` (`label_id`), `create` (`title`), `update` (`label_id`), `delete` (`label_id`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| label_id | string | get, update, delete | Label slug |
| title | string | create, update | Label title |
| color | string | create, update | Color |
| visibility | string[] | create, update | `filter`, `list` |
| scope | string[] | create, update | `tests`, `suites`, `runs`, `plans`, `steps`, `templates` |
| field | object | create, update | Custom field definition |
| page / per_page | integer | list | Pagination |

---

## tags

Read-only tag access with counts. `/api/v2/{project_id}/tags`

**Commands:** `list`, `get` (`tag_id`), `search` (`tag_id` or `query`; delegates to `get`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| tag_id | string | get, search | Tag title to look up |
| query | string | search | Search text |

---

## milestones

Read-only milestone access. `/api/v2/{project_id}/milestones`

**Commands:** `list`, `get` (`milestone_id`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| milestone_id | string | get | Milestone slug |
| type | string | list | Filter by milestone type title, e.g. `Sprint` or `Release` |
| status | string | list | `created`, `active`, or `closed` |
| page / per_page | integer | list | Pagination |

---

## issues

Global issue operations across resources. `/api/v2/{project_id}/issues`

**Commands:**

| Command | Description | Runtime-required params |
|---------|-------------|------------------------|
| `list` | List linked issues (scope by one resource id, filter by source) | — |
| `create` | Link issue to a resource | exactly one resource id, plus exactly one of `url`/`jira_id` |
| `delete` | Unlink issue | `issue_id`, `type` |

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| test_id / suite_id / run_id / plan_id | string | list, create | Resource scope (one at a time) |
| testrun_id | integer | list, create | Resource scope (one at a time) |
| source | string | list | Filter by source |
| url | string | create | Issue URL |
| jira_id | string | create | Jira issue ID |
| issue_id | integer | delete | Issue ID |
| type | string | delete | `issue` or `jira_issue` |
| page / per_page | integer | list | Pagination |

---

## requirements

Manage requirements, including file uploads. `/api/v2/{project_id}/requirements`

**Commands:** `list`, `get` (`requirement_id`), `create` (`title`, `source_type`), `update` (`requirement_id`), `delete` (`requirement_id`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| requirement_id | string | get, update, delete | Requirement ID |
| title | string | create, update | Requirement title |
| source_type | string | create | `jira`, `confluence`, `file`, `text` |
| source | string | list | Filter by source: `jira`, `confluence`, `file`, `text` |
| scope | string | list | `global`, `attached`, `detached`, `without_suites` |
| description | string | create, update | Required for text requirements (min 500 chars on create); only applied for text requirements on update |
| details | string | create, update | Details |
| active | boolean | create, update | Active flag |
| global | boolean | create, update | Global flag |
| confluence_url | string | create | Required for confluence requirements |
| files | string[] | create, update | Local file paths to upload for file requirements |
| page / per_page | integer | list | Pagination |

---

## branches

Manage project branches. Requires the branches feature (enterprise plan). `/api/v2/{project_id}/branches`

**Commands:** `list`, `get` (`branch_id`), `create` (`title`), `update` (`branch_id`), `delete` (`branch_id`)

**Parameters:**

| Name | Type | Commands | Description |
|------|------|----------|-------------|
| branch_id | string | get, update, delete | Branch slug |
| title | string | create, update | Branch title; a slug is generated from it |
| filter_state | string | list | `active` or `merged` |
| filter_title | string | list | Partial substring match on title |
| page / per_page | integer | list | Pagination |

---

## Common Patterns

### Branch Scoping

The `tests`, `suites`, and `runs` tools accept an optional `branch` parameter (branch slug) on their CRUD commands.
Omit it (or pass `main`) to operate on the main branch.

- For **tests** and **suites**: a matching branch-local record is used when it exists, falling back to main; updating or deleting a main-only record creates an isolated branch-local copy rather than mutating main.
- For **runs**: creating a run under a branch tags it with that branch (it is then only visible/reachable when the same `branch` is passed again), but updating or deleting an existing run always applies directly to whatever record was found — it is never forked.

```json
{
  "name": "tests",
  "arguments": {
    "command": "list",
    "branch": "feature-login",
    "tql": "priority == 'high'"
  }
}
```

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

All list commands support:
- `page` (integer, min: 1)
- `per_page` (integer, min: 1, max: 100)

### List Response Projection

List commands request slim responses from the API by default. Heavy entity fields such as `description` and `code`, duplicate title fields, and null values are omitted from the result.

- `verbose: true` disables the backend slim request and returns full objects.
- `fields: ["id", "title", "description"]` disables the backend slim request and returns only the selected non-null fields.
- If both are provided, `verbose: true` takes precedence and returns full objects.

The backend `slim` parameter is managed internally by MCP; callers should use `verbose` or `fields` rather than pass `slim` directly.

### Counts & Aggregation

The primary `list` command of each entity accepts `count` (and `group_by`) to fetch totals and aggregated breakdowns without transferring the entity list — useful for "how many" questions instead of pulling full pages. Scoped list commands (`issues_list`, `attachments_list`) do not support aggregation.

- `count: true` returns only `meta` with `total` (no `data`). Example response:
  ```json
  { "meta": { "total": 59, "page": 1, "per_page": 30 } }
  ```
- `group_by: <field>` (used with `count: true`) adds a `meta.group_by` breakdown. Example:
  ```json
  { "meta": { "total": 59, "page": 1, "per_page": 30, "group_by": { "passed": 30, "failed": 8 } } }
  ```

`group_by` is a free-form field name (e.g. `status`, `state`, `priority`, `created_by`); the backend validates which fields each resource supports. When grouping by `created_by`, the breakdown is keyed by **user email** (e.g. `{"alice@example.com": 12}`), not by user ID.

When `count: true` is set, MCP omits `slim` — the response is meta-only, so field projection does not apply.

### Issue Linking

Two ways to link issues:
1. **Generic issues** - via `url` parameter
2. **Jira issues** - via `jira_id` parameter

### Attachments

Attachment uploads use local file paths readable by the MCP server process and send one multipart/form-data field named `files`. Multiple files per request are not supported by the Public API v2 endpoint.

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
| envs | string | No | Comma-separated execution environments; must exactly match `project_info` environments (422 with `known_environments` otherwise) |
| page | integer | No | Page number |
| per_page | integer | No | Items per page |
| min | number | No | Pass rate lower bound (0-1, default 0.1), only for `flaky` |
| max | number | No | Pass rate upper bound (0-1, default 0.9), only for `flaky` |
| order_by | string | No | `flakiness` (default, closest to 50/50 first) or `pass_rate` (lowest pass rate first), only for `flaky` |
| threshold_ms | integer | No | Duration threshold, only for `slow` |
| maturity_days | integer | No | Minimum test age, only for `never-executed` |
| run | string | No | Scope to one run UID, only for `flaky` and `slow` |
| group_by | string | No | `suite`, `priority`, `tag`, `label`, `env`, or `test` — return aggregate counts instead of a test list. Only for `failing`, `skipped`, `flaky`, `slow`, `never-executed` (`env` not supported for `never-executed`; `test` only for `slow`); other combinations return 422 |

For `flaky`, each row includes `pass_rate` (0-1, same scale as `min`/`max`) and `flakiness` (0-1, peaks at 1.0 for an even pass/fail split). `flaky_rate` is deprecated (raw 2-3 scale).

With `group_by`, the response is `{ data: [{ key, label, test_count }], meta: { group_by, kind, total_groups } }`, sorted by `test_count` descending and not paginated. `key` is the suite UID for `suite` (with `label` = suite title); for the other dimensions `key` and `label` are the value itself.

`group_by=test` (only for `slow`) returns per-test time stats instead of counts: `key` (test UID), `label` (title), `executions`, `avg_run_time`, `max_run_time`, `p95_run_time`, `total_run_time`, sorted by `total_run_time` descending. Stats cover every execution in the period that meets `threshold_ms`, not just the latest one.

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
| kind | string | Yes | See kinds below |
| q | string | No | TQL filter, for example `tag IN ['@smoke']` |
| days | integer | No | Lookback window in days |
| from | string | No | Inclusive start date in YYYY-MM-DD format |
| to | string | No | Inclusive end date in YYYY-MM-DD format |
| envs | string | No | Comma-separated execution environments; must exactly match `project_info` environments (422 with `known_environments` otherwise) |
| milestone | string | No | Milestone slug (`id` from the `milestones` tool, `list` command). Required for `milestone-*` kinds — without it they return an empty result, not an error. Unknown slug returns 422 |
| page | integer | No | Page number. Only for `runs-summary` and `milestone-runs`, which are always paginated (default `page=1`, `per_page=30`; `meta.total`/`meta.total_pages` always present). Ignored by other kinds |
| per_page | integer | No | Rows per page (default 30, max 100). Only for `runs-summary` and `milestone-runs` |

**Kinds:**
- Trend series (one row per day): `success-rate-by-date`, `automation-rate-by-date`, `automation-by-date`, `testruns-by-date`, `priority-by-date`
- Priority breakdowns: `failed-runs-by-priority`, `run-results-by-priority-status`, and their `latest-*` variants (`latest-failed-runs-by-priority`, `latest-run-results-by-priority-status` — most recent run only)
- Summaries: `project-summary`, `runs-summary`
- Sprint/release reporting (require `milestone`): `milestone-completion`, `milestone-tests`, `milestone-runs`, `milestone-plans`, `milestone-requirements`, `milestone-users`

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

---

### analytics_charts_list

List saved analytics charts and queries. Each item bundles one or more TQL queries under a single
title, optionally rendered as a chart (e.g. "pie") or kept as a plain saved query.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| has_chart | boolean | No | `true` — only items with a chart type set; `false` — only plain saved queries |
| kind | string | No | Filter by context: `tests` or `runs` |
| my_charts | boolean | No | When `true`, only items created by the authenticated user |
| only_widgets | boolean | No | When `true`, only items marked as dashboard widgets |
| page | integer | No | Page number |
| per_page | integer | No | Items per page (1–100) |

**Example:**
```json
{
  "name": "analytics_charts_list",
  "arguments": {
    "kind": "tests",
    "has_chart": true,
    "page": 1,
    "per_page": 20
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/analytics/charts`

---

### analytics_charts_get

Get a saved chart or query definition: title, chart type, context (tests/runs), and the ordered
TQL queries that make it up.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| chart_id | string | Yes | Chart public UID |

**Example:**
```json
{
  "name": "analytics_charts_get",
  "arguments": {
    "chart_id": "abc123"
  }
}
```

**Returns:** chart `id`, `title`, `context`, `chart` display type (or null for a plain saved
query), `queries: [{ number, query, title, label, color }]`, `options`, and the `url` to view
the chart in Testomat.io.

**API Endpoint:** `GET /api/v2/{project_id}/analytics/charts/{id}`

---

### analytics_charts_results

Get the current results of a saved chart.

Without `number`, returns the match count for every query in the chart — a cheap way to render
a chart's totals. With `number` (zero-based query index), returns the matching tests or runs
for that query, paginated.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| chart_id | string | Yes | Chart public UID |
| number | integer | No | Zero-based query index to fetch full results for; omit for per-query totals |
| page | integer | No | Page number (with `number`) |
| per_page | integer | No | Items per page, 1–100 (with `number`) |

**Example — totals for every query:**
```json
{
  "name": "analytics_charts_results",
  "arguments": {
    "chart_id": "abc123"
  }
}
```

**Example — matching tests of the third query:**
```json
{
  "name": "analytics_charts_results",
  "arguments": {
    "chart_id": "abc123",
    "number": 2,
    "page": 1,
    "per_page": 50
  }
}
```

**API Endpoint:** `GET /api/v2/{project_id}/analytics/charts/{id}/result`
