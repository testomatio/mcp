# Testomat.io MCP Server

A Model Context Protocol (MCP) server for Testomat.io API integration with AI assistants like Cursor.

## Installation

### Prerequisites

- Node.js 18 or higher (with built-in fetch support)
- npm or yarn package manager
- Testomat.io account with API access

### Install via npm

```bash
npm install -g @testomatio/mcp
```

### Or run directly with npx

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

# If installed globally
testomatio-mcp --token testomat_YOUR_TOKEN_HERE --project your-project-id

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
      "args": ["@testomatio/mcp", "--token", "testomat_YOUR_TOKEN_HERE", "--project", "YOUR_PROJECT_ID"]
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
      "args": ["@testomatio/mcp", "--project", "YOUR_PROJECT_ID"],
      "env": {
        "TESTOMATIO_API_TOKEN": "testomat_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### Option 3: Global Installation

If you've installed the package globally:

```json
{
  "mcpServers": {
    "testomatio": {
      "command": "testomatio-mcp",
      "args": ["--token", "testomat_YOUR_TOKEN_HERE", "--project", "YOUR_PROJECT_ID"]
    }
  }
}
```

## Features

### Tools

#### Tests
* `get_tests` – Get all tests for the project with optional filtering  
* `search_tests` – Search tests by keywords, tags, labels, TQL queries, and other filters  

#### Test Suites
* `search_suites` – Search suites and their tests by keywords, tags, labels, and other filters  
* `get_root_suites` – Get all root-level suites for the project  
* `get_suite` – Get a specific suite with its child suites and tests  

#### Test Runs
* `get_runs` – Get all test runs for the project  
* `get_run` – Get a specific test run with detailed information  
* `get_testruns` – Get test runs for a specific test with optional date filtering  

#### Test Plans
* `get_plans` – Get all test plans for the project  
* `get_plan` – Get a specific test plan with attached items 

## Example Usage in Cursor

Once configured, you can ask your AI assistant questions like:

- "Show me all the tests in the project"
- "Get the test runs for test ID abc123"
- "What are the root suites in this project?"
- "Show me details for test run xyz789"
- "List all automated tests with the @smoke tag"
- "Get all test plans for this project"

 


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
