# GitHub Actions Workflows

This directory contains CI/CD workflows for the Testomatio MCP server project.

## 📋 Workflows Overview

### 1. Unit Tests (`.github/workflows/unit-tests.yml`)

**Purpose**: Run unit tests on every push and pull request
**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Features**:
- ✅ Matrix testing across Node.js versions 18, 20, 22
- ✅ Runs `npm run test:unit`
- ✅ Generates coverage report with `npm run test:coverage`
- ✅ Uploads coverage to Codecov (only for Node 20)

**Environment Variables**: None required (uses mocked dependencies)

### 2. Integration Tests (`.github/workflows/integration-tests.yml`)

**Purpose**: Run integration tests against real Testomatio API
**Triggers**:
- Push to `main` branch
- Pull requests to `main` branch
- Daily schedule (2 AM UTC)
- Manual dispatch

**Features**:
- ✅ Runs `npm run test:integration`
- ✅ Tests against real Testomatio API
- ✅ Creates and cleans up test data
- ✅ Uploads integration coverage to Codecov
- ✅ Includes smoke tests for main branch

**Environment Variables**: Required (see setup below)

## 🔑 Required GitHub Secrets

Integration tests require the following GitHub repository secrets:

### Production Environment

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `TESTOMATIO_API_TOKEN` | Your Testomatio API token (starts with `testomat_`) | `testomat_abc123...` |
| `TESTOMATIO_PROJECT_ID` | Your Testomatio project ID | `my-project` |
| `TESTOMATIO_BASE_URL` | Your Testomatio instance URL (optional) | `https://app.testomat.io` |

### Staging Environment (Optional)

For testing against a staging environment:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `TESTOMATIO_API_TOKEN_STAGING` | Staging API token | `testomat_staging123...` |
| `TESTOMATIO_PROJECT_ID_STAGING` | Staging project ID | `staging-project` |
| `TESTOMATIO_BASE_URL_STAGING` | Staging instance URL | `https://staging.testomat.io` |

## ⚙️ Setting Up GitHub Secrets

### Using GitHub UI

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each required secret:

```bash
# Repository Secrets
TESTOMATIO_API_TOKEN=testomat_your_actual_token_here
TESTOMATIO_PROJECT_ID=your_project_id
TESTOMATIO_BASE_URL=https://app.testomat.io
```

### Using GitHub CLI

```bash
# Set up repository secrets
gh secret set TESTOMATIO_API_TOKEN --body "testomat_your_actual_token_here"
gh secret set TESTOMATIO_PROJECT_ID --body "your_project_id"
gh secret set TESTOMATIO_BASE_URL --body "https://app.testomat.io"
```

### Using Environment Variables

For local development, create a `.env` file:

```bash
# .env
TESTOMATIO_API_TOKEN=testomat_your_actual_token_here
TESTOMATIO_PROJECT_ID=your_project_id
TESTOMATIO_BASE_URL=https://app.testomat.io
```

## 🚀 Workflow Features

### Security

- ✅ Secrets are encrypted and not exposed in logs
- ✅ Environment variables are only available to the running job
- ✅ Secrets are scoped to repository or organization level

### Matrix Testing

Unit tests run across multiple Node.js versions to ensure compatibility:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
```

### Coverage Reporting

- **Unit tests**: Upload to Codecov with `unittests` flag
- **Integration tests**: Upload to Codecov with `integration` flag
- **Failures**: Coverage failures don't break the build

### Scheduled Runs

Integration tests run daily to catch any API changes or regressions:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Manual Triggers

Integration tests can be triggered manually:

```bash
# Trigger via GitHub CLI
gh workflow run integration-tests.yml

# Trigger with inputs to test all environments
gh workflow run integration-tests.yml -f test_all_environments=true
```

## 🐛 Troubleshooting

### Common Issues

1. **Missing Secrets Error**
   ```
   Error: Missing required environment variables
   ```
   **Solution**: Set up the required GitHub secrets

2. **Authentication Failed**
   ```
   Error: Authentication failed: HTTP 401: Unauthorized
   ```
   **Solution**: Verify your API token is valid and not expired

3. **Project Not Found**
   ```
   Error: HTTP 404: Not Found
   ```
   **Solution**: Verify your project ID and permissions

### Debug Mode

To debug integration test failures locally:

```bash
# Run integration tests with verbose output
npm run test:integration -- --verbose

# Run specific test
npm run test:integration -- --testNamePattern="should create label"
```

### Test Data Cleanup

Integration tests automatically clean up created test data, but if tests fail:

```bash
# Manual cleanup via Testomatio UI or API
# Check for test suites/folders/labels with "Integration Test" in the name
```

## 📊 Monitoring

### Workflow Status

- **Unit Tests**: Run on every PR/merge
- **Integration Tests**: Run on main branch merges and daily
- **Coverage**: Combined coverage report from both test types

### Alerting

- GitHub Actions will email on workflow failures
- Configure Slack/Teams notifications via repository settings
- Set up required status checks for branch protection

## 🔧 Customization

### Adding New Test Types

1. Add test command to `package.json`
2. Create new workflow file in `.github/workflows/`
3. Follow existing patterns for environment variables

### Environment-Specific Testing

Modify the matrix in integration tests to test multiple environments:

```yaml
strategy:
  matrix:
    environment: [staging, production]
```

### Custom Schedules

Change the cron schedule in integration tests:

```yaml
schedule:
  - cron: '0 14 * * 1-5'  # Weekdays at 2 PM UTC
```

## 📚 Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Testing Framework](https://jestjs.io/)
- [Codecov Integration](https://docs.codecov.com/)
- [Testomatio API Documentation](https://docs.testomat.io/)