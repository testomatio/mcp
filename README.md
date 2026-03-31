# Testomat.io MCP Server

Model Context Protocol (MCP) server that enables AI assistants (Claude, Cursor, etc.) to interact with Testomat.io Public API v2.

## Features

- **Full CRUD** for core entities:
  - Tests, Suites, Plans, Runs, TestRuns, RunGroups, Steps, Snippets, Labels
  - Tags (read-only access)
  - Issues (global + scoped helpers for tests/suites/runs/testruns/plans)
- **Smart Search** - delegates to list endpoints with query/filter forwarding
- **Issue Linking** - link/unlink issues to any resource
- **API Compatibility** - automatic handling of payload format differences (flat vs wrapped)
- **Run Management** - status transitions via `status_event` parameter

## Quick Start

### Installation

```bash
npm install -g @testomatio/mcp
```

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

## Usage with AI Assistants

### Cursor IDE

Add to `.cursorrules` or settings.json:

```json
{
  "mcpServers": {
    "testomatio": {
      "command": "testomatio-mcp",
      "args": ["--token", "<TOKEN>", "--project", "<PROJECT_ID>"],
      "env": {
        "TESTOMATIO_PROJECT_TOKEN": "<TOKEN>",
        "TESTOMATIO_PROJECT_ID": "<PROJECT_ID>"
      }
    }
  }
}
```

### Claude Desktop

```json
{
  "mcpServers": {
    "testomatio": {
      "command": "node",
      "args": ["/path/to/mcp/index.js", "--token", "<TOKEN>", "--project", "<PROJECT_ID>"]
    }
  }
}
```

## Quick Examples

**List tests:**
```json
{
  "name": "tests_list",
  "arguments": { "page": 1, "per_page": 50 }
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

## Documentation

Complete tool reference: [docs/tools.md](./docs/tools.md)

## Project Structure

```
src/
├── config/          # Config loading, defaults
├── core/            # Errors, logger
├── api/             # HTTP client, Testomat.io API client
├── mcp/             # MCP server, tools, registry
│   ├── definitions/ # Tool definitions by entity
│   ├── configs/     # Registry generation configs
│   └── registry/    # Tool handlers
└── cli/             # CLI bootstrap
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TESTOMATIO_PROJECT_TOKEN` | Yes* | - | Project token (preferred) |
| `TESTOMATIO_API_TOKEN` | Yes* | - | Alternative token |
| `TESTOMATIO_PROJECT_ID` | Yes | - | Project ID |
| `TESTOMATIO_BASE_URL` | No | `https://app.testomat.io` | API base URL |

*Either `TESTOMATIO_PROJECT_TOKEN` or `TESTOMATIO_API_TOKEN`

## Important Notes

- **Run Status** - Use `runs_update` with `status_event` for transitions (finish, launch, rerun, etc.)
- **Search** - No dedicated `/search` endpoints; search uses list with filters
- **Issue Linking** - Scoped helpers available: `{entity}_issues_link/unlink`

## Development

```bash
npm install
npm run start -- --token <TOKEN> --project <PROJECT_ID>
```
