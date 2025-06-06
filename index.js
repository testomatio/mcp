#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { program } from 'commander';

class TestomatioMCPServer {
  constructor(config) {
    this.config = config;
    this.jwtToken = null;
    this.server = new Server(
      {
        name: 'testomatio-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  async authenticate() {
    if (this.jwtToken) {
      return this.jwtToken;
    }

    const response = await fetch(`${this.config.baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `api_token=${this.config.token}`,
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.jwt) {
      throw new Error('Authentication failed: No JWT token received in response');
    }

    this.jwtToken = data.jwt;

    return this.jwtToken;
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_tests',
            description: 'Get all tests for the project with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  description: 'Plan ID to fetch tests from specific plan',
                },
                query: {
                  type: 'string',
                  description: 'Search by text or query language (start with =). Example: "=tag == \'slow\'"',
                },
                state: {
                  type: 'string',
                  enum: ['manual', 'automated'],
                  description: 'Filter by test state',
                },
                suite_id: {
                  type: 'string',
                  description: 'Get tests from specific suite',
                },
                tag: {
                  type: 'string',
                  description: 'Filter by tag (e.g., @slow)',
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by labels array',
                },
              },
            },
          },
          {
            name: 'search_tests',
            description: 'Search tests by keywords, tags, labels, TQL queries, and other filters',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search by keywords, tags (@smoke), or Jira issues (JIRA-123)',
                },
                tql: {
                  type: 'string',
                  description: 'Test Query Language for advanced filtering (e.g., "tag == \'smoke\' and state == \'manual\'")',
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by labels (e.g., ["ui", "critical"])',
                },
                state: {
                  type: 'string',
                  enum: ['manual', 'automated'],
                  description: 'Filter by test state',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'normal', 'high', 'critical'],
                  description: 'Filter by priority level',
                },
                filter: {
                  type: 'object',
                  description: 'Advanced filter hash (e.g., {state: "manual", priority: "high"})',
                  additionalProperties: true,
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                },
              },
            },
          },
          {
            name: 'search_suites',
            description: 'Search suites and their tests by keywords, tags, labels, and other filters',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search by keywords, tags (@smoke), or Jira issues (JIRA-123)',
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by labels (e.g., ["ui", "critical"])',
                },
                state: {
                  type: 'string',
                  enum: ['manual', 'automated'],
                  description: 'Filter by test state',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'normal', 'high', 'critical'],
                  description: 'Filter by priority level',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                },
              },
            },
          },
          {
            name: 'get_root_suites',
            description: 'Get all root-level suites for the project',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_suite',
            description: 'Get a specific suite with its child suites and tests',
            inputSchema: {
              type: 'object',
              properties: {
                suite_id: {
                  type: 'string',
                  description: 'Suite identifier',
                },
              },
              required: ['suite_id'],
            },
          },
          {
            name: 'get_runs',
            description: 'Get all test runs for the project',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_run',
            description: 'Get a specific test run with detailed information',
            inputSchema: {
              type: 'object',
              properties: {
                run_id: {
                  type: 'string',
                  description: 'Run identifier',
                },
                tree: {
                  type: 'boolean',
                  description: 'Include list of tests',
                },
              },
              required: ['run_id'],
            },
          },
          {
            name: 'get_testruns',
            description: 'Get test runs for a specific test with optional date filtering',
            inputSchema: {
              type: 'object',
              properties: {
                test_id: {
                  type: 'string',
                  description: 'Test identifier',
                },
                finished_at_date_range: {
                  type: 'string',
                  description: 'Date range filter (format: YYYY-MM-DD,YYYY-MM-DD)',
                },
              },
              required: ['test_id'],
            },
          },
          {
            name: 'get_plans',
            description: 'Get all test plans for the project',
            inputSchema: {
              type: 'object',
              properties: {
                detail: {
                  type: 'boolean',
                  description: 'Include detailed information',
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by labels array',
                },
                page: {
                  type: 'number',
                  description: 'Page number for pagination',
                },
              },
            },
          },
          {
            name: 'get_plan',
            description: 'Get a specific test plan with attached items',
            inputSchema: {
              type: 'object',
              properties: {
                plan_id: {
                  type: 'string',
                  description: 'Plan identifier',
                },
              },
              required: ['plan_id'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_tests':
            return await this.getTests(args);
          case 'search_tests':
            return await this.searchTests(args);
          case 'search_suites':
            return await this.searchSuites(args);
          case 'get_root_suites':
            return await this.getRootSuites();
          case 'get_suite':
            return await this.getSuite(args.suite_id);
          case 'get_runs':
            return await this.getRuns();
          case 'get_run':
            return await this.getRun(args.run_id, args.tree);
          case 'get_testruns':
            return await this.getTestruns(args.test_id, args.finished_at_date_range);
          case 'get_plans':
            return await this.getPlans(args);
          case 'get_plan':
            return await this.getPlan(args.plan_id);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async makeRequest(path, params = {}) {
    // Ensure we have a valid JWT token
    const jwt = await this.authenticate();

    const url = new URL(`${this.config.baseUrl}/api/${this.config.projectId}${path}`);

    // Add query parameters with proper array handling
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle arrays (e.g., labels[])
          value.forEach(v => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': jwt,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If unauthorized, clear the JWT token and retry once
      if (response.status === 401 && this.jwtToken) {
        this.jwtToken = null;
        return this.makeRequest(path, params);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  escapeXml(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  formatValue(value, fieldName) {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle arrays of simple values (tags, labels, etc.)
    if (Array.isArray(value)) {
      if (fieldName === 'tags') {
        return value.map(tag => `<tag>${this.escapeXml(tag)}</tag>`).join('');
      }
      if (fieldName === 'labels') {
        return value.map(label => `<label>${this.escapeXml(label)}</label>`).join('');
      }
      if (fieldName === 'tests-ids') {
        return value.map(id => `<test_id>${id}</test_id>`).join('');
      }
      // Default array handling
      return value.map(item => `<item>${this.escapeXml(item)}</item>`).join('');
    }

    // Handle nested objects
    if (typeof value === 'object') {
      return this.formatNestedObject(value, fieldName);
    }

    // Handle strings that need escaping
    if (typeof value === 'string') {
      return this.escapeXml(value);
    }

    // Handle other primitives
    return String(value);
  }

  formatNestedObject(obj, fieldName) {
    if (fieldName === 'test' && obj.id) {
      // Special handling for test objects in testruns
      return `
    <id>${obj.id || ''}</id>
    <title>${this.escapeXml(obj.title || '')}</title>
    <priority>${obj.priority || 'normal'}</priority>
    <tags>${(obj.tags || []).map(tag => `<tag>${this.escapeXml(tag)}</tag>`).join('')}</tags>`;
    }

    // Generic object formatting
    return Object.entries(obj)
      .map(([key, value]) => `<${key}>${this.formatValue(value, key)}</${key}>`)
      .join('\n    ');
  }

  formatModel(model, tagName, fields) {
    const attributes = model.attributes || {};
    const lines = [`<${tagName}>`];

    // Always include ID from root level
    lines.push(`  <id>${model.id || ''}</id>`);

    // Process specified fields
    fields.forEach(field => {
      let value;
      let xmlFieldName = field;

      // Handle field mapping for hyphenated API fields
      if (field.includes('-')) {
        value = attributes[field];
      } else {
        // Try both versions for flexibility
        value = attributes[field] || attributes[field.replace('_', '-')];
        xmlFieldName = field.replace('-', '_');
      }

      const formattedValue = this.formatValue(value, field);

      if (field === 'test' && typeof value === 'object') {
        // Special case for nested test objects
        lines.push(`  <test>${formattedValue}\n  </test>`);
      } else {
        lines.push(`  <${xmlFieldName}>${formattedValue}</${xmlFieldName}>`);
      }
    });

    lines.push(`</${tagName}>`);
    return lines.join('\n');
  }

  async getTests(filters = {}) {
    const params = this.buildSearchParams(filters);
    const data = await this.makeRequest('/tests', params);
    const formattedTests = data.data.map(test =>
      this.formatModel(test, 'test', [
        'title', 'description', 'code', 'priority',
        'state', 'suite-id', 'tags', 'file'
      ])
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Tests for project ${this.config.projectId}:\n\n${formattedTests}`,
        },
      ],
    };
  }

  async searchTests(filters = {}) {
    const params = this.buildSearchParams(filters);
    const data = await this.makeRequest('/tests', params);

    const formattedTests = data.data.map(test =>
      this.formatModel(test, 'test', [
        'title', 'description', 'code', 'priority',
        'state', 'suite-id', 'tags', 'file'
      ])
    ).join('\n\n');

    const searchDescription = this.buildSearchDescription(filters);

    return {
      content: [
        {
          type: 'text',
          text: `Search results for tests${searchDescription}:\n\n${formattedTests || 'No tests found matching the criteria.'}`,
        },
      ],
    };
  }

  async searchSuites(filters = {}) {
    // Add filter=true for suites search to include tests
    const params = this.buildSearchParams({ ...filters, filter: true });
    const data = await this.makeRequest('/suites', params);

    const formattedSuites = data.data.map(suite =>
      this.formatModel(suite, 'suite', [
        'title', 'description', 'test-count', 'is-root', 'file-type'
      ])
    ).join('\n\n');

    const searchDescription = this.buildSearchDescription(filters);

    return {
      content: [
        {
          type: 'text',
          text: `Search results for suites${searchDescription}:\n\n${formattedSuites || 'No suites found matching the criteria.'}`,
        },
      ],
    };
  }

  buildSearchDescription(filters) {
    const descriptions = [];

    if (filters.query) {
      if (filters.query.startsWith('@')) {
        descriptions.push(`tagged with "${filters.query}"`);
      } else if (filters.query.match(/^[A-Z]+-\d+$/)) {
        descriptions.push(`linked to Jira issue "${filters.query}"`);
      } else {
        descriptions.push(`containing "${filters.query}"`);
      }
    }

    if (filters.tql) {
      descriptions.push(`matching TQL: "${filters.tql}"`);
    }

    if (filters.labels && filters.labels.length > 0) {
      descriptions.push(`with labels: ${filters.labels.join(', ')}`);
    }

    if (filters.state) {
      descriptions.push(`state: ${filters.state}`);
    }

    if (filters.priority) {
      descriptions.push(`priority: ${filters.priority}`);
    }

    if (filters.filter && typeof filters.filter === 'object') {
      const filterDesc = Object.entries(filters.filter)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      descriptions.push(`filtered by: ${filterDesc}`);
    }

    return descriptions.length > 0 ? ` (${descriptions.join(', ')})` : '';
  }

  async getRootSuites() {
    const data = await this.makeRequest('/suites');
    const formattedSuites = data.data.map(suite =>
      this.formatModel(suite, 'suite', [
        'title', 'description', 'test-count', 'is-root', 'file-type'
      ])
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Root suites for project ${this.config.projectId}:\n\n${formattedSuites}`,
        },
      ],
    };
  }

  async getSuite(suiteId) {
    const data = await this.makeRequest(`/suites/${suiteId}`);
    const formattedSuite = this.formatModel(data.data, 'suite', [
      'title', 'description', 'test-count', 'is-root', 'file-type'
    ]);

    // Format child suites and tests if they exist
    let childContent = '';
    if (data.data.relationships?.children?.data) {
      const childSuites = data.data.relationships.children.data
        .map(child => this.formatModel(child, 'suite', [
          'title', 'description', 'test-count', 'is-root', 'file-type'
        ])).join('\n\n');
      if (childSuites) {
        childContent += `\n\nChild Suites:\n${childSuites}`;
      }
    }

    if (data.data.relationships?.tests?.data) {
      const tests = data.data.relationships.tests.data
        .map(test => this.formatModel(test, 'test', [
          'title', 'description', 'code', 'priority',
          'state', 'suite-id', 'tags', 'file'
        ])).join('\n\n');
      if (tests) {
        childContent += `\n\nTests:\n${tests}`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Suite ${suiteId}:\n\n${formattedSuite}${childContent}`,
        },
      ],
    };
  }

  async getRuns() {
    const data = await this.makeRequest('/runs');
    const formattedRuns = data.data.map(run =>
      this.formatModel(run, 'run', [
        'status', 'title', 'tests-count', 'automated', 'duration',
        'passed', 'failed', 'skipped', 'created-at', 'finished-at'
      ])
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Test runs for project ${this.config.projectId}:\n\n${formattedRuns}`,
        },
      ],
    };
  }

  async getRun(runId, tree = false) {
    const params = tree ? { tree: 'true' } : {};
    const data = await this.makeRequest(`/runs/${runId}`, params);
    const formattedRun = this.formatModel(data.data, 'run', [
      'status', 'title', 'tests-count', 'automated', 'duration',
      'passed', 'failed', 'skipped', 'created-at', 'finished-at'
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Test run ${runId}:\n\n${formattedRun}`,
        },
      ],
    };
  }

  async getTestruns(testId, dateRange) {
    const params = { test_id: testId };
    if (dateRange) {
      params.finished_at_date_range = dateRange;
    }

    const data = await this.makeRequest('/testruns', params);
    const formattedTestruns = data.data.map(testrun =>
      this.formatModel(testrun, 'testrun', [
        'status', 'run-time', 'message', 'run-id', 'test'
      ])
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Test runs for test ${testId}:\n\n${formattedTestruns}`,
        },
      ],
    };
  }

  async getPlans(filters = {}) {
    const data = await this.makeRequest('/plans', filters);
    const formattedPlans = data.data.map(plan =>
      this.formatModel(plan, 'plan', [
        'title', 'test-count', 'kind', 'created-at', 'tests-ids', 'labels'
      ])
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Test plans for project ${this.config.projectId}:\n\n${formattedPlans}`,
        },
      ],
    };
  }

  async getPlan(planId) {
    const data = await this.makeRequest(`/plans/${planId}`);
    const formattedPlan = this.formatModel(data.data, 'plan', [
      'title', 'test-count', 'kind', 'created-at', 'tests-ids', 'labels'
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Test plan ${planId}:\n\n${formattedPlan}`,
        },
      ],
    };
  }

  async run() {
    // Test authentication on startup
    try {
      await this.authenticate();
      console.error('✓ Successfully authenticated with Testomatio API');
    } catch (error) {
      console.error('✗ Authentication failed:', error.message);
      process.exit(1);
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Testomatio MCP server running on stdio');
  }
}

// Parse command line arguments using commander
function parseArgs() {
  program
    .name('testomatio-mcp')
    .description('Model Context Protocol server for Testomatio API')
    .version('1.0.0')
    .option('-t, --token <token>', 'Testomatio API token')
    .option('-p, --project <project>', 'Project ID')
    .option('--base-url <url>', 'Base URL for Testomatio API', 'https://app.testomat.io')
    .parse();

  const options = program.opts();

  const token = options.token || process.env.TESTOMATIO_API_TOKEN;
  const projectId = options.project;
  const baseUrl = options.baseUrl || process.env.TESTOMATIO_BASE_URL || 'https://app.testomat.io';

  if (!token) {
    console.error('Error: API token is required. Use --token <token> or set TESTOMATIO_API_TOKEN environment variable');
    process.exit(1);
  }

  if (!projectId) {
    console.error('Error: Project ID is required. Use --project <project_id>');
    process.exit(1);
  }

  return { token, projectId, baseUrl };
}

// Main execution
async function main() {
  try {
    const config = parseArgs();
    const server = new TestomatioMCPServer(config);
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TestomatioMCPServer };
