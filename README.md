# Testomat.io MCP Server

Model Context Protocol (MCP) server that enables AI assistants (Claude, Cursor, OpenCode, etc.) to interact with Testomat.io Public API v2.

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

**Optional: corporate network certificates**
```bash
export TESTOMATIO_USE_SYSTEM_CA=1
```

Enable this when HTTPS requests fail because Node.js does not trust a corporate TLS inspection certificate that is already trusted by the operating system.

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

### OpenCode

Create `.opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "testomat": {
      "type": "local",
      "command": [
        "node",
        "node_modules/@testomatio/mcp/index.js",
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
| `TESTOMATIO_USE_SYSTEM_CA` | No | `false` | Load operating system trusted CA certificates for corporate TLS inspection/proxy environments |

*Either `TESTOMATIO_PROJECT_TOKEN` or `TESTOMATIO_API_TOKEN`

## Corporate TLS Certificates

Some corporate networks inspect HTTPS traffic and re-sign certificates with a company root certificate. Browsers and system tools may work because that certificate is trusted by macOS Keychain, Windows Certificate Store, or the Linux system store, while Node.js may still reject the same request with errors such as `unable to get local issuer certificate` or `self signed certificate in certificate chain`.

Set `TESTOMATIO_USE_SYSTEM_CA=1` to make the MCP server load the operating system trusted CA certificates for its API requests:

```bash
TESTOMATIO_USE_SYSTEM_CA=1 testomatio-mcp --token <TOKEN> --project <PROJECT_ID>
```

This keeps TLS verification enabled. It only extends the trusted CA list with certificates trusted by the operating system.

## Important Notes

- **Run Status** - Use `runs_update` with `status_event` for transitions (finish, launch, rerun, etc.)
- **Search** - No dedicated `/search` endpoints; search uses list with filters
- **Issue Linking** - Scoped helpers available: `{entity}_issues_link/unlink`

## Development

```bash
npm install
npm run start -- --token <TOKEN> --project <PROJECT_ID>
```
