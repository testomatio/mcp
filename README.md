# Testomat.io MCP Server

Model Context Protocol (MCP) server that enables AI assistants (Claude, Cursor, OpenCode, etc.) to interact with Testomat.io Public API v2.

## Features

- **Full CRUD** for core entities:
  - Tests, Suites, Plans, Runs, TestRuns, RunGroups, Steps, Snippets, Labels
  - Tags and Milestones (read-only access)
  - Issues (global + scoped helpers for tests/suites/runs/testruns/plans)
  - Attachments (scoped helpers for tests/suites/testruns)
  - Requirements (including file uploads from local file paths)
- **Project Information** - fetch project configuration, metadata, features, and CI profiles
- **Issue Linking** - link/unlink issues to any resource
- **API Compatibility** - automatic handling of payload format differences (flat vs wrapped)
- **Automatic API Sessions** - groups MCP changes in Testomat.io history using API sessions
- **Run Management** - status transitions via `status_event` parameter
- **TQL-Only Search** - `tests_list` and `runs_list` use `tql` as the single search/filter input
- **Built-In TQL Reference** - TQL parameters include the exact field whitelist and examples; `tql_help` provides syntax details on demand
- **Tool Surface Profiles** - expose only the tools a session needs via `--tools full|core|read` (default `full`); cuts the per-call schema cost for long agentic sessions

## Quick Start

### Installation

```bash
npm install -g @testomatio/mcp@latest
```

Need enterprise analytics tools? Install `@testomatio/mcp-enterprise@latest` instead. Details are in the `Enterprise Analytics` section below.

### Configuration

**Required credentials:**
- `TESTOMATIO_PROJECT_TOKEN` - Your project API token
- `TESTOMATIO_PROJECT_ID` - Your project ID

**Run server:**
```bash
testomatio-mcp --token <PROJECT_TOKEN> --project <PROJECT_ID>
```

**Or with environment variables:**
```bash
export TESTOMATIO_PROJECT_TOKEN=<PROJECT_TOKEN>
export TESTOMATIO_PROJECT_ID=<PROJECT_ID>
testomatio-mcp
```

**Optional: custom base URL**
```bash
export TESTOMATIO_BASE_URL=https://beta.testomat.io
```

**Optional: tool surface profile**

By default the server exposes all tools. For long, token-sensitive sessions you can expose a smaller set with `--tools`:

```bash
testomatio-mcp --token <PROJECT_TOKEN> --project <PROJECT_ID> --tools core
```

| Profile | What's exposed |
|---------|----------------|
| `full` (default) | Everything |
| `core` | Core entities + CRUD (excludes steps, snippets, labels, rungroups, attachments) |
| `read` | Core entities, read-only (list/get) |

Values are case-insensitive; an unknown value prevents the server from starting. Set the profile at launch with the flag or the `TESTOMATIO_TOOLS` environment variable — it can't be changed mid-session. The CLI flag takes precedence when both are set.

## Usage with AI Assistants

### Cursor IDE

Add this config to `.cursor/mcp.json` in your project, or to `~/.cursor/mcp.json` for global access:

```json
{
  "mcpServers": {
    "testomatio": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@testomatio/mcp@latest",
        "--token",
        "<TOKEN>",
        "--project",
        "<PROJECT_ID>"
      ],
      "env": {
        "TESTOMATIO_BASE_URL": "https://app.testomat.io"
      }
    }
  }
}
```

### Claude Desktop

Add this config to:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "testomatio": {
      "command": "npx",
      "args": [
        "-y",
        "@testomatio/mcp@latest",
        "--token",
        "<TOKEN>",
        "--project",
        "<PROJECT_ID>"
      ],
      "env": {
        "TESTOMATIO_BASE_URL": "https://app.testomat.io"
      }
    }
  }
}
```

### OpenCode

Add this config to `opencode.json` in your project root, or to `~/.config/opencode/opencode.json` for global access:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "testomat": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@testomatio/mcp@latest",
        "--token",
        "<TOKEN>",
        "--project",
        "<PROJECT_ID>"
      ],
      "enabled": true,
      "environment": {
        "TESTOMATIO_BASE_URL": "https://app.testomat.io"
      }
    }
  }
}
```

## Quick Examples

**List tests:**
```json
{
  "name": "tests_list",
  "arguments": { "page": 1, "per_page": 50, "tql": "priority == 'high'" }
}
```

**Create test:**
```json
{
  "name": "tests_create",
  "arguments": {
    "title": "User login test",
    "suite_id": "123",
    "priority": "high"
  }
}
```

**Create run:**
```json
{
  "name": "runs_create",
  "arguments": {
    "title": "Smoke tests",
    "kind": "automated",
    "env": "production"
  }
}
```

**Finish run:**
```json
{
  "name": "runs_update",
  "arguments": {
    "run_id": "456",
    "status_event": "finish"
  }
}
```

**Upload attachment to a test:**
```json
{
  "name": "tests_attachments_upload",
  "arguments": {
    "test_id": "123",
    "file_path": "/path/to/screenshot.png"
  }
}
```

## Documentation

Complete tool reference: [docs/tools.md](./docs/tools.md)

## Project Structure

```text
src/
|- config/          # Config loading, defaults
|- core/            # Errors, logger
|- api/             # HTTP client, Testomat.io API client
|- mcp/             # MCP server, tools, registry
|  |- definitions/  # Tool definitions by entity
|  |- configs/      # Registry generation configs
|  `- registry/     # Tool handlers
`- cli/             # CLI bootstrap
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TESTOMATIO_PROJECT_TOKEN` | Yes* | - | Project token (preferred) |
| `TESTOMATIO_API_TOKEN` | Yes* | - | Alternative token |
| `TESTOMATIO_PROJECT_ID` | Yes | - | Project ID |
| `TESTOMATIO_BASE_URL` | No | `https://app.testomat.io` | API base URL |
| `TESTOMATIO_TOOLS` | No | `full` | Tool profile: `full`, `core`, or `read` |

*Either `TESTOMATIO_PROJECT_TOKEN` or `TESTOMATIO_API_TOKEN`

## Corporate TLS Certificates

If the MCP server runs behind a corporate proxy or TLS inspection, Node.js may reject Testomat.io HTTPS requests even when the same URL works in a browser. This usually means the company root certificate is trusted by the operating system, but not by Node.js.

Use Node.js system CA support:

```bash
NODE_OPTIONS=--use-system-ca testomatio-mcp --token <TOKEN> --project <PROJECT_ID>
```

For MCP clients, pass `NODE_OPTIONS` in the server environment:

```json
{
  "mcpServers": {
    "testomatio": {
      "command": "testomatio-mcp",
      "args": ["--token", "<TOKEN>", "--project", "<PROJECT_ID>"],
      "env": {
        "NODE_OPTIONS": "--use-system-ca"
      }
    }
  }
}
```

If your Node.js version does not support `--use-system-ca`, export the corporate root certificate to a PEM file and use Node.js extra CA support:

```bash
NODE_EXTRA_CA_CERTS=/path/to/company-root-ca.pem testomatio-mcp --token <TOKEN> --project <PROJECT_ID>
```

## Important Notes

- **Run Status** - Use `runs_update` with `status_event` for transitions (finish, launch, rerun, etc.)
- **Search/Filter** - No dedicated `/search` endpoints; filtering is done via the `*_list` tools (`tql` for tests and runs, OpenAPI-aligned filters for other entities)
- **Slim List Responses** - List tools request compact API responses by default and omit heavy entity fields and null values. Pass `verbose: true` to return full objects, or `fields: ["id", "title", "description"]` to return only selected fields. Both options disable the backend `slim=true` request so heavy fields remain available when requested.
- **TQL** - Use `tql` as the single search/filter input for `tests_list` and `runs_list`
- **TQL Syntax** - For user-facing syntax details and more examples, see the official TQL docs: https://docs.testomat.io/advanced/tql/
- **TQL Scope** - TQL parameter descriptions keep the documented field whitelist in-band; call `tql_help` for syntax details and additional examples
- **Issue Linking** - Scoped helpers available: `{entity}_issues_link/unlink`
- **Attachments** - Scoped helpers available for tests, suites, and testruns: `{entity}_attachments_list/upload/delete`. Upload sends one local file path as multipart field `file`.
- **Enterprise Package** - Analytics tools are intentionally exposed only by `@testomatio/mcp-enterprise`, not by the standard `@testomatio/mcp` package
- **API Sessions** - The server automatically starts a Testomat.io session before the first `POST`, `PUT`, or `DELETE` request, sends the returned session hash as `X-Session-Hash` on later mutating requests, and stops the session when the MCP server shuts down. `GET` requests do not start or use sessions.

## Development

```bash
npm install
npm run start -- --token <TOKEN> --project <PROJECT_ID>
```

For local MCP development, point Claude Desktop to the checked-out entrypoint:

```json
{
  "mcpServers": {
    "testomatio-local": {
      "command": "node",
      "args": ["/path/to/mcp/index.js", "--token", "<TOKEN>", "--project", "<PROJECT_ID>"]
    }
  }
}
```

## Enterprise Analytics

Enterprise analytics is available only in the separate `@testomatio/mcp-enterprise` package.

Installation:

```bash
npm install -g @testomatio/mcp-enterprise@latest
```

Run:

```bash
testomatio-mcp-enterprise --token <PROJECT_TOKEN> --project <PROJECT_ID>
```

Included tools:

- `analytics_tests` - `GET /api/v2/{project_id}/analytics/tests/{kind}`
- `analytics_stats` - `GET /api/v2/{project_id}/analytics/stats/{kind}`
- `analytics_charts_list` - `GET /api/v2/{project_id}/analytics/charts`
- `analytics_charts_get` - `GET /api/v2/{project_id}/analytics/charts/{id}`
- `analytics_charts_results` - `GET /api/v2/{project_id}/analytics/charts/{id}/result`

Analytics endpoints require the `api_analytics` subscription feature. Use `q` as the TQL filter parameter for analytics tools.

Example `analytics_tests` call:

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

Example `analytics_stats` call:

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

`analytics_charts_get` returns a chart definition with its TQL queries; `analytics_charts_results`
returns per-query totals or the matching tests/runs of one query (by its zero-based `number`).

Example `analytics_charts_results` call:

```json
{
  "name": "analytics_charts_results",
  "arguments": {
    "chart_id": "abc123",
    "number": 2,
    "per_page": 50
  }
}
```
