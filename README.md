# Testomat.io MCP (v2 Rebuild)

Clean rewrite baseline for issue `#7238`.

This branch starts a new architecture from scratch with focus on:
- maintainability
- extensibility
- clear separation of responsibilities

## Current Status

Scaffold is ready:
- modular project layout under `src/`
- centralized config loading and validation
- reusable HTTP client for API v2
- MCP server shell with tool registry
- placeholder tool definitions for CRUD/search domains

## Architecture

- `src/config` - config/constants and CLI/env normalization
- `src/core` - errors and logging
- `src/api` - low-level HTTP + Testomatio API v2 client
- `src/mcp` - MCP transport/server, tool definitions, tool registry
- `src/cli` - CLI entrypoint

## Running

```bash
npm install
npm run start -- --token <PROJECT_TOKEN> --project <PROJECT_ID> --base-url https://beta.testomat.io
```

Environment variables:
- `TESTOMATIO_PROJECT_TOKEN`
- `TESTOMATIO_PROJECT_ID`
- `TESTOMATIO_BASE_URL` (optional)

## Next Implementation Steps

1. Implement full CRUD + search for Tests and Suites.
2. Implement Runs management tools.
3. Implement Plans management tools.
4. Add new test strategy for rewritten architecture.
5. Restore CI pipelines for the new test matrix.
