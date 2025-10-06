# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides AI assistants access to the Testomatio API. It's designed to integrate with AI tools like Cursor and Claude to allow querying test data, runs, plans, and suites from Testomatio projects.

## Commands

### Development
- `npm start` or `npm run dev` - Start the MCP server
- `node index.js` - Run the server directly

### Testing
- There are no tests currently defined (`npm test` will fail)

### Usage
```bash
# Run with command line args
npx @testomatio/mcp --token testomat_YOUR_TOKEN --project PROJECT_ID

# Run with environment variables
TESTOMATIO_API_TOKEN=testomat_YOUR_TOKEN npx @testomatio/mcp --project PROJECT_ID
```

## Architecture

### Core Components

1. **TestomatioMCPServer Class** (`index.js:11-765`)
   - Main server class implementing MCP protocol
   - Handles authentication with Testomatio API using JWT tokens
   - Provides 10 MCP tools for querying different Testomatio resources

2. **Authentication System** (`index.js:30-56`)
   - Uses API token to obtain JWT from `/api/login`
   - JWT is cached and automatically refreshed on 401 errors
   - Supports both command line args and environment variables

3. **API Request Handler** (`index.js:317-353`)
   - Centralized HTTP client with automatic JWT refresh
   - Handles URL construction and query parameter serialization
   - Proper error handling for unauthorized requests

4. **XML Formatting System** (`index.js:355-448`)
   - Converts JSON API responses to semantic XML for LLM consumption
   - Handles nested objects, arrays, and special field types (tags, labels)
   - Escapes XML content for safety

### MCP Tools Available

The server exposes these tools for AI assistants:

**Tests:**
- `get_tests` - Get all tests with filtering
- `search_tests` - Advanced search with TQL, tags, labels
- `create_test` - Create new test with label values support
- `update_test` - Update existing test with label values support

**Suites:**
- `search_suites` - Search test suites
- `get_root_suites` - Get top-level suites
- `get_suite` - Get specific suite with children
- `create_suite` - Create new suite
- `create_folder` - Create new folder

**Runs:**
- `get_runs` - List test runs
- `get_run` - Get specific run details
- `get_testruns` - Get runs for a specific test

**Plans:**
- `get_plans` - List test plans
- `get_plan` - Get specific plan details

**Labels:**
- `create_label` - Create new label with predefined values

### Configuration

Required:
- `TESTOMATIO_API_TOKEN` - API token (starts with `testomat_`)
- Project ID via `--project` flag

Optional:
- `TESTOMATIO_BASE_URL` - Custom Testomatio instance URL (defaults to `https://app.testomat.io`)

### Custom Fields and Labels Support

The MCP server provides two distinct ways to assign values to tests, suites, and folders:

**1. Using `labels_ids` with label:value syntax:**
```javascript
{
  "labels_ids": ["priority:high", "severity:critical", "type:regression"]
}
```
- Direct label assignment with values using `label:value` format
- Good for simple label assignments
- Works with existing Testomatio labels

**2. Using `fields` parameter (structured custom fields):**
```javascript
{
  "fields": {
    "priority": "high",
    "severity": "critical",
    "risk_score": "8.5",
    "team": "backend"
  }
}
```
- Structured way to set custom fields
- Cleaner syntax for AI assistants
- Supports any custom field defined in your Testomatio project
- Maps to Testomatio's custom-fields API

**Available for:**
- `create_test` and `update_test` - Test custom fields
- `create_suite` - Suite custom fields
- `create_folder` - Folder custom fields

**Creating Labels with Predefined Values:**
Use the `create_label` tool to create labels with dropdown options:
```javascript
{
  "title": "Priority",
  "field": {
    "type": "list",
    "value": "Low\nNormal\nHigh\nCritical"
  }
}
```

### Key Implementation Details

- Uses ES modules (`"type": "module"` in package.json)
- Built on `@modelcontextprotocol/sdk` for MCP compliance
- Uses `commander` for CLI argument parsing
- Requires Node.js 18+ for built-in fetch support
- All API responses are formatted as semantic XML for optimal LLM processing
- Supports two distinct approaches for field assignment:
  - `labels_ids` with `label:value` syntax for direct label assignment
  - `fields` parameter for structured custom field assignment
- Custom fields are sent to Testomatio API as `custom-fields` object