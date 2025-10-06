# Testomat.io MCP Server

A Model Context Protocol (MCP) server for Testomat.io API integration with AI assistants like Cursor.

## Installation

### Prerequisites

- Node.js 18 or higher (with built-in fetch support)
- npm or yarn package manager
- Testomat.io account with API access

### Run directly with npx

```bash
npx @testomatio/mcp --token <your-token> --project <project-id>
```

## Usage

### Command Line Options

The MCP server can be started using command line arguments or environment variables:

#### Using Command Line Arguments

```bash
# Using short flags
npx @testomatio/mcp -t testomat_YOUR_TOKEN_HERE -p your-project-id

# Using long flags
npx @testomatio/mcp --token testomat_YOUR_TOKEN_HERE --project your-project-id

# With custom base URL
npx @testomatio/mcp --token testomat_YOUR_TOKEN_HERE --project your-project-id --base-url https://your-instance.testomat.io
```

#### Using Environment Variables

```bash
# Set environment variables
export TESTOMATIO_API_TOKEN=testomat_YOUR_TOKEN_HERE
export TESTOMATIO_BASE_URL=https://app.testomat.io  # Optional, defaults to https://app.testomat.io

# Run with project ID
npx @testomatio/mcp --project your-project-id

# Or run directly with environment variables
TESTOMATIO_API_TOKEN=testomat_YOUR_TOKEN_HERE npx @testomatio/mcp --project your-project-id
```

### Getting Your API Token

1. Go to [Testomat.io](https://app.testomat.io)
2. Navigate to user tokens https://app.testomat.io/account/access_tokens
3. Create and copy **General API token** (starts with `testomat_`)

### Getting Your Project ID

Your project ID can be found in the URL when you're viewing your project:
```
https://app.testomat.io/projects/YOUR_PROJECT_ID
```

## Integration with Cursor

To use this MCP server with Cursor, add the following configuration to your Cursor settings:

### Option 1: Using npx (Recommended)

Add this to your Cursor MCP settings (`cursor-settings.json` or through the Cursor settings UI):

```json
{
  "mcpServers": {
    "testomatio": {
      "command": "npx",
      "args": ["-y", "@testomatio/mcp@latest", "--token", "testomat_YOUR_TOKEN_HERE", "--project", "YOUR_PROJECT_ID"]
    }
  }
}
```

### Option 2: Using Environment Variables

First, set your environment variables in your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export TESTOMATIO_API_TOKEN=testomat_YOUR_TOKEN_HERE
```

Then add this to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "testomatio": {
      "command": "npx",
      "args": ["-y", "@testomatio/mcp@latest", "--project", "YOUR_PROJECT_ID"],
      "env": {
        "TESTOMATIO_API_TOKEN": "testomat_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

## Features

### Tools

#### Tests
* `get_tests` – Get all tests (params: `plan`, `query`, `state`, `suite_id`, `tag`, `labels`) — api: GET `/tests`
* `search_tests` – Search tests (params: `query`, `tql`, `labels`, `state`, `priority`, `filter`, `page`) — api: GET `/tests`
* `create_test` – Create a new test (params: `suite_id`, `title`, `description`, `code`, `file`, `state`, `tags`, `jira_issues`, `assigned_to`, `labels_ids`, `fields`) — api: POST `/tests`
* `update_test` – Update an existing test (params: `test_id`, `suite_id`, `title`, `description`, `code`, `file`, `state`, `tags`, `jira_issues`, `assigned_to`, `labels_ids`, `fields`) — api: PUT `/tests/{test_id}`

#### Test Suites
* `search_suites` – Search suites (params: `query`, `labels`, `state`, `priority`, `page`) — api: GET `/suites`
* `get_root_suites` – List root-level suites (no params) — api: GET `/suites`
* `get_suite` – Get one suite (params: `suite_id`) — api: GET `/suites/{suite_id}`
* `create_suite` – Create a new suite (params: `title`, `description`, `parent_id`, `fields`) — api: POST `/suites`
* `create_folder` – Create a new folder (params: `title`, `description`, `parent_id`, `fields`) — api: POST `/suites`

#### Labels
* `create_label` – Create a new label with optional custom field (params: `title`, `color`, `scope`, `visibility`, `field`) — api: POST `/labels`

### Custom Fields and Labels

The MCP server provides two distinct ways to assign values to tests, suites, and folders:

#### 1. Using `labels_ids` with label:value syntax
```javascript
{
  "labels_ids": ["priority:high", "severity:critical", "type:regression"]
}
```
- Direct label assignment with values using `label:value` format
- Good for simple label assignments
- Works with existing Testomatio labels

#### 2. Using `fields` parameter (structured custom fields)
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

#### Example Usage
```javascript
// Create a test with custom fields
{
  "tool": "create_test",
  "arguments": {
    "suite_id": "123",
    "title": "Login Test",
    "fields": {
      "priority": "high",
      "severity": "critical",
      "team": "backend"
    }
  }
}

// Update a test with label:value syntax
{
  "tool": "update_test",
  "arguments": {
    "test_id": "456",
    "labels_ids": ["priority:high", "severity:critical"]
  }
}
```

#### Test Runs
* `get_runs` – List all runs (no params) — api: GET `/runs`
* `get_run` – Get one run (params: `run_id`, `tree`) — api: GET `/runs/{run_id}`
* `get_testruns` – Runs for a test (params: `test_id`, `finished_at_date_range`) — api: GET `/testruns`

#### Test Plans
* `get_plans` – List all plans (params: `detail`, `labels`, `page`) — api: GET `/plans`
* `get_plan` – Get one plan (params: `plan_id`) — api: GET `/plans/{plan_id}`

## Example Usage in Cursor

Once configured, you can ask your AI assistant questions like:

- "Show me all the tests in the project"
- "Get the test runs for test ID abc123"
- "What are the root suites in this project?"
- "Show me details for test run xyz789"
- "List all automated tests with the @smoke tag"
- "Get all test plans for this project"
- "Create a new test called 'Login validation' in suite suite-123"
- "Update test test-456 to change its description and add @regression tag"
- "Create a test with custom fields: priority='high', severity='critical', team='backend'"
- "Update test test-789 to set custom fields for risk score and assigned team"
- "Create a new suite called 'Authentication Tests' with description 'All login and signup related tests'"
- "Create a suite with custom fields for team ownership and priority level"
- "Create a folder called 'API Tests' to organize API-related test suites with custom fields"
- "Create a label called 'Severity' with color '#ffe9ad' and predefined values like 'Blocker', 'Critical', 'Major', 'Minor', 'Normal', 'Trivial'"

## Query Patterns

### Basic Information Queries

These queries retrieve general information without specific filtering:

- **"Show me all the tests in the project"** → `get_tests` tool
- **"What are the root suites in this project?"** → `get_root_suites` tool  
- **"Get all test runs"** → `get_runs` tool
- **"Get all test plans for this project"** → `get_plans` tool

### Test Management Queries

These queries allow creating and updating tests:

- **"Create a new test called 'Login validation' in suite suite-123"** → `create_test` tool with `title: "Login validation"`, `suite_id: "suite-123"`
- **"Update test test-456 to change its description"** → `update_test` tool with `test_id: "test-456"`, `description: "new description"`
- **"Create an automated test with @smoke tag"** → `create_test` tool with `state: "automated"`, `tags: ["smoke"]`
- **"Create a test with custom fields: priority='high', severity='critical'"** → `create_test` tool with `title: "Test Title"`, `suite_id: "suite-123"`, `fields: { "priority": "high", "severity": "critical" }`
- **"Update test test-789 to set custom fields for risk score and team"** → `update_test` tool with `test_id: "test-789"`, `fields: { "risk_score": "8.5", "team": "backend" }`

### Suite and Folder Management Queries

These queries help organize your test structure:

- **"Create a new suite called 'Authentication Tests'"** → `create_suite` tool with `title: "Authentication Tests"`
- **"Create a suite for login tests with description"** → `create_suite` tool with `title: "Login Tests"`, `description: "All login related test cases"`
- **"Create a suite with custom fields for team ownership and priority level"** → `create_suite` tool with `title: "Backend Tests"`, `fields: { "team": "backend", "priority": "high" }`
- **"Create a folder called 'API Tests' under parent suite-123"** → `create_folder` tool with `title: "API Tests"`, `parent_id: "suite-123"`
- **"Create a folder with custom fields for team and project"** → `create_folder` tool with `title: "Integration Tests"`, `fields: { "team": "qa", "project": "mobile-app" }`
- **"Create a test suite for payment features"** → `create_suite` tool with `title: "Payment Features", description: "Tests covering payment processing"`
- **"Create a folder to organize integration tests"** → `create_folder` tool with `title: "Integration Tests"`

**Note**: Suites can only contain other suites, while folders can contain both suites and folders (but no tests).

### Label Creation Queries

These queries help create custom labels for better test categorization:

- **"Create a label called 'Severity' with red color"** → `create_label` tool with `title: "Severity"`, `color: "#ff6b6b"`
- **"Create a severity label with predefined values"** → `create_label` tool with `title: "Severity"`, `color: "#ffe9ad"`, `field: { "type": "list", "short": true, "value": "Blocker\nCritical\nMajor\nNormal\nMinor\nTrivial" }`
- **"Create a simple label for test types"** → `create_label` tool with `title: "Test Type"`, `scope: ["tests", "suites"]`
- **"Create a label visible in test lists"** → `create_label` tool with `title: "Category"`, `visibility: ["list"]`

### Specific Item Queries

These queries target specific entities by ID:

- **"Get test runs for test ID abc123"** → `get_testruns` tool with `test_id: "abc123"`
- **"Show me details for test run xyz789"** → `get_run` tool with `run_id: "xyz789"`
- **"Get suite details for suite-456"** → `get_suite` tool with `suite_id: "suite-456"`

### Search and Filter Queries

These queries use advanced filtering capabilities:

- **"List all automated tests with the @smoke tag"** → `search_tests` tool with `query: "@smoke"`, `state: "automated"`
- **"Search for tests containing 'login'"** → `search_tests` tool with `query: "login"`
- **"List tests tagged @critical or labelled 'ux' with critical severity"** → `search_tests` tool with `tql: "tag == 'critical' or label == 'ux' and severity == 'critical'"`
- **"Find tests linked to JIRA-123"** → `search_tests` tool with `tql: jira == 'BDCP-2'`

### Advanced Query Syntax

#### Test Query Language (TQL)

The `search_tests` tool supports TQL for complex filtering:

```
"tag == 'smoke' and state == 'manual'"
"severity == 'critical' or label == 'ux'"
```

#### Tag-Based Searches

Tags can be searched using the `@` prefix:

```
@smoke        # Tests tagged with 'smoke'
@regression   # Tests tagged with 'regression'
@critical     # Tests tagged with 'critical'
```

#### Jira Integration

Tests linked to Jira issues can be found using issue keys:

```
JIRA-123      # Tests linked to JIRA-123
PROJ-456      # Tests linked to PROJ-456
```

## Troubleshooting

### Common Issues

1. **"API token is required" error**
   - Make sure your token starts with `testomat_`
   - Verify the token is correct in your Testomat.io project settings

2. **"Project ID is required" error**
   - Check that you're passing the correct project ID
   - Verify the project ID exists and you have access to it

3. **Connection errors**
   - Ensure you have internet connectivity
   - Check if your firewall allows connections to `app.testomat.io`
   - Verify your API token has the necessary permissions

4. **MCP server not starting in Cursor**
   - Check Cursor's MCP logs for error messages
   - Ensure Node.js 18+ is installed and accessible
   - Try running the command manually first to test

### Debug Mode

To see detailed logs when running the server:

```bash
DEBUG=* npx @testomatio/mcp --token <token> --project <project-id>
```

## API Reference

For detailed information about the underlying Testomat.io API, refer to the [Testomat.io API Documentation](https://app.testomat.io/docs/api/).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/testomatio/mcp.git
cd mcp

# Install dependencies
npm install

# Run unit tests
npm test

# Run integration tests (requires environment variables)
npm run test:integration

# Run all tests
npm run test:all
```

### Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Fast tests with mocked dependencies
- **Integration Tests**: Real API tests against Testomat.io

#### Running Tests Locally

```bash
# Unit tests only
npm run test:unit

# Integration tests (requires .env file)
npm run test:integration

# With coverage
npm run test:coverage
npm run test:coverage:integration
```

#### Environment Setup for Integration Tests

Create a `.env` file:

```bash
TESTOMATIO_API_TOKEN=testomat_your_token_here
TESTOMATIO_PROJECT_ID=your_project_id
TESTOMATIO_BASE_URL=https://app.testomat.io  # optional
```

### CI/CD

This project uses GitHub Actions for continuous integration:

- ✅ **Unit Tests**: Run on every push/PR across Node.js 18, 20, 22
- ✅ **Integration Tests**: Run daily and on main branch merges
- ✅ **Coverage Reports**: Automatic upload to Codecov
- ✅ **Security**: Secrets management for API credentials


### Code Quality

- Follow existing code style patterns
- Add tests for new functionality
- Update documentation when needed
- Ensure all tests pass before submitting PRs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:
1. Check the [Testomat.io Documentation](https://docs.testomat.io)
2. Open an issue on GitHub
3. Contact Testomat.io support

## Changelog

### v1.0.0
- Initial release
- Support for all major Testomat.io API endpoints
- MCP-compatible tool interface
- Semantic XML formatting for LLM processing
