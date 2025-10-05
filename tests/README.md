# Tests Structure

This directory contains both unit and integration tests for the Testomatio MCP server.

## 📁 Directory Structure

```
tests/
├── unit/                   # Unit tests (mocked dependencies)
│   └── index.test.js      # Core functionality tests
├── integration/            # Integration tests (real API calls)
│   └── index.test.js      # Real API integration tests
└── README.md             # This file
```

## 🧪 Test Types

### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual methods and functions in isolation
- **Dependencies**: Mocked (no external API calls)
- **Speed**: Fast
- **Coverage**: Core business logic, authentication, XML formatting, etc.
- **Command**: `npm test` or `npm run test:unit`

### Integration Tests (`tests/integration/`)
- **Purpose**: Test real API integration with Testomatio
- **Dependencies**: Requires valid Testomatio credentials
- **Speed**: Slower (real HTTP requests)
- **Coverage**: API endpoints, authentication flow, data creation
- **Command**: `npm run test:integration`

## 🔧 Environment Setup

### For Unit Tests
No additional setup required - uses mocked dependencies.

### For Integration Tests
Set these environment variables in `.env` file:
```bash
TESTOMATIO_API_TOKEN=testomat_your_token_here
TESTOMATIO_PROJECT_ID=your_project_id
TESTOMATIO_BASE_URL=https://app.testomat.io  # optional, defaults to this
```

## 📋 Available Commands

```bash
# Run unit tests only (default)
npm test
npm run test:unit

# Run integration tests (requires credentials)
npm run test:integration

# Watch mode for unit tests
npm run test:watch

# Watch mode for integration tests
npm run test:integration:watch

# Coverage for unit tests
npm run test:coverage

# Coverage for integration tests
npm run test:coverage:integration

# Run all tests (unit + integration)
npm run test:all
```

## 🧩 Test Coverage

### Unit Tests Cover:
- ✅ Constructor and server initialization
- ✅ Authentication with JWT token handling
- ✅ API request handling with automatic JWT refresh
- ✅ XML formatting with special character escaping
- ✅ Search parameter building
- ✅ Tool methods (getTests, createSuite, createFolder)
- ✅ Error handling

### Integration Tests Cover:
- ✅ Real authentication with Testomatio API
- ✅ Real API requests (tests, suites, runs)
- ✅ Real suite/folder creation and cleanup
- ✅ XML formatting with real data
- ✅ Error handling with real API responses

## 🚨 Important Notes

1. **Integration tests require valid credentials** - they will be skipped if `TESTOMATIO_API_TOKEN` and `TESTOMATIO_PROJECT_ID` are not set
2. **Integration tests create real data** - they create test suites/folders and attempt to clean them up afterward
3. **Unit tests use mocked fetch** - they don't make any real HTTP requests
4. **Both test suites run independently** - unit tests don't depend on external systems