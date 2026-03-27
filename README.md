# Testomat.io MCP Server

Model Context Protocol (MCP) server for Testomat.io Public API v2.

## Features

- Project-token authentication.
- CRUD coverage for core entities:
  - tests, suites, plans, runs, testruns, rungroups, steps, snippets, labels
  - tags (read APIs)
  - issues (global + scoped resource helpers)
- Search helpers implemented as list aliases with query/filter forwarding.
- Issue-link helpers for tests/suites/runs/testruns/plans.
- API compatibility fallback for body format differences (flat vs wrapped payload).

## Project Structure

- `src/config` - config loading, normalization, defaults
- `src/core` - errors and logger
- `src/api` - HTTP client and API resource client
- `src/mcp` - MCP server, tool definitions, tool registry
- `src/cli` - CLI bootstrap

## Run

```bash
npm install
npm run start -- --token <PROJECT_TOKEN> --project <PROJECT_ID>
```

Optional:

```bash
npm run start -- --token <PROJECT_TOKEN> --project <PROJECT_ID> --base-url https://beta.testomat.io
```

## Environment Variables

- `TESTOMATIO_PROJECT_TOKEN` (preferred) or `TESTOMATIO_API_TOKEN`
- `TESTOMATIO_PROJECT_ID`
- `TESTOMATIO_BASE_URL` (optional, default `https://app.testomat.io`)

## Notes

- Run status transitions are done via `runs_update` with `status_event`.
- Dedicated API `/search` routes are not required; search uses list endpoints with filters.
