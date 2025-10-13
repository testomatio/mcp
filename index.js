#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { program } from 'commander';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeBaseUrl(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  // Remove any internal whitespace characters that may appear when the URL
  // gets broken across lines (e.g. "http://\n  localhost:3000").
  return trimmed.replace(/\s+/g, '');
}

class TestomatioMCPServer {
  constructor(config) {
    this.config = {
      ...config,
      token: normalizeString(config.token),
      projectId: normalizeString(config.projectId),
      baseUrl: normalizeBaseUrl(config.baseUrl),
    };
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
      const errorText = await response.text();
      throw new Error(`Authentication failed: HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
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
          {
            name: 'create_test',
            description: 'Create a new test in the specified suite',
            inputSchema: {
              type: 'object',
              properties: {
                suite_id: {
                  type: 'string',
                  description: 'Suite ID where the test will be created',
                },
                title: {
                  type: 'string',
                  description: 'Test title',
                },
                description: {
                  type: 'string',
                  description: 'Test description',
                },
                code: {
                  type: 'string',
                  description: 'Source code of an automated test',
                },
                file: {
                  type: 'string',
                  description: 'File of an automated test',
                },
                state: {
                  type: 'string',
                  enum: ['manual', 'automated'],
                  description: 'State of the test',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of tags for the test',
                },
                jira_issues: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of assigned Jira issues',
                },
                assigned_to: {
                  type: 'string',
                  description: 'User assigned to this test',
                },
                labels_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Slugs of labels to assign to the test. Supports label:value format (e.g., ["priority:high", "severity:critical"])',
                },
                fields: {
                  type: 'object',
                  description: 'Set custom fields for the test. Object with field names as keys and values as properties (e.g., {"priority": "high", "severity": "critical"})',
                  additionalProperties: {
                    type: 'string'
                  },
                },
              },
              required: ['suite_id', 'title'],
            },
          },
          {
            name: 'update_test',
            description: 'Update an existing test',
            inputSchema: {
              type: 'object',
              properties: {
                test_id: {
                  type: 'string',
                  description: 'ID of the test to update',
                },
                suite_id: {
                  type: 'string',
                  description: 'Suite ID where the test belongs',
                },
                title: {
                  type: 'string',
                  description: 'Test title',
                },
                description: {
                  type: 'string',
                  description: 'Test description',
                },
                code: {
                  type: 'string',
                  description: 'Source code of an automated test',
                },
                file: {
                  type: 'string',
                  description: 'File of an automated test',
                },
                state: {
                  type: 'string',
                  enum: ['manual', 'automated'],
                  description: 'State of the test',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'normal', 'high', 'critical'],
                  description: 'Priority level of the test',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of tags for the test',
                },
                jira_issues: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of assigned Jira issues',
                },
                assigned_to: {
                  type: 'string',
                  description: 'User assigned to this test',
                },
                labels_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Slugs of labels to assign to the test. Supports label:value format (e.g., ["priority:high", "severity:critical"])',
                },
                fields: {
                  type: 'object',
                  description: 'Set custom fields for the test. Object with field names as keys and values as properties (e.g., {"priority": "high", "severity": "critical"})',
                  additionalProperties: {
                    type: 'string'
                  },
                },
              },
              required: ['test_id'],
            },
          },
          {
            name: 'create_suite',
            description: 'Create a new suite. Suites can only contain other suites (no tests or folders)',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Suite title',
                },
                description: {
                  type: 'string',
                  description: 'Suite description',
                },
                parent_id: {
                  type: 'string',
                  description: 'Parent suite ID to create this suite under',
                },
                fields: {
                  type: 'object',
                  description: 'Set custom fields for the suite. Object with field names as keys and values as properties (e.g., {"priority": "high", "team": "backend"})',
                  additionalProperties: {
                    type: 'string'
                  },
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'create_folder',
            description: 'Create a new folder. Folders can contain suites and folders (but no tests)',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Folder title',
                },
                description: {
                  type: 'string',
                  description: 'Folder description',
                },
                parent_id: {
                  type: 'string',
                  description: 'Parent folder or suite ID to create this folder under',
                },
                fields: {
                  type: 'object',
                  description: 'Set custom fields for the folder. Object with field names as keys and values as properties (e.g., {"priority": "high", "team": "backend"})',
                  additionalProperties: {
                    type: 'string'
                  },
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'create_label',
            description: 'Create a new label with optional custom field configuration. Labels can be used to tag and categorize tests and suites',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Label title (e.g., "Severity", "Priority", "Type")',
                },
                color: {
                  type: 'string',
                  description: 'Label color in hex format (e.g., "#ffe9ad")',
                },
                scope: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['tests', 'suites']
                  },
                  description: 'Where this label can be used (e.g., ["tests", "suites"])',
                },
                visibility: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Where the label is visible (e.g., ["list"])',
                },
                field: {
                  type: 'object',
                  description: 'Custom field configuration for labels with predefined values',
                  properties: {
                    type: {
                      type: 'string',
                      description: 'Field type (e.g., "list", "string", "number")',
                    },
                    short: {
                      type: 'boolean',
                      description: 'Whether to display short version',
                    },
                    value: {
                      type: 'string',
                      description: 'Predefined values for the field (newline separated for list type)',
                    },
                  },
                  required: ['type'],
                },
              },
              required: ['title'],
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
          case 'create_test':
            return await this.createTest(args);
          case 'update_test':
            return await this.updateTest(args);
          case 'create_suite':
            return await this.createSuite(args);
          case 'create_folder':
            return await this.createFolder(args);
          case 'create_label':
            return await this.createLabel(args);
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

  async makePostRequest(path, data) {
    const jwt = await this.authenticate();
    const url = `${this.config.baseUrl}/api/${this.config.projectId}${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': jwt,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401 && this.jwtToken) {
        this.jwtToken = null;
        return this.makePostRequest(path, data);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}; ${await response.text()}`);
    }

    return await response.json();
  }

  async makePutRequest(path, data) {
    const jwt = await this.authenticate();
    const url = `${this.config.baseUrl}/api/${this.config.projectId}${path}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': jwt,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401 && this.jwtToken) {
        this.jwtToken = null;
        return this.makePutRequest(path, data);
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

  buildSearchParams(filters = {}) {
    const params = {};

    // Handle basic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'labels' && Array.isArray(value)) {
          // Labels need special array handling
          value.forEach(label => {
            if (!params['labels[]']) {
              params['labels[]'] = [];
            }
            if (Array.isArray(params['labels[]'])) {
              params['labels[]'].push(label);
            } else {
              params['labels[]'] = [params['labels[]'], label];
            }
          });
        } else if (key === 'filter' && typeof value === 'object') {
          // Handle filter hash (e.g., filter[state]=manual)
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            params[`filter[${filterKey}]`] = filterValue;
          });
        } else if (Array.isArray(value)) {
          // Handle other arrays
          value.forEach(v => {
            const paramKey = `${key}[]`;
            if (!params[paramKey]) {
              params[paramKey] = [];
            }
            if (Array.isArray(params[paramKey])) {
              params[paramKey].push(v);
            } else {
              params[paramKey] = [params[paramKey], v];
            }
          });
        } else {
          params[key] = String(value);
        }
      }
    });

    return params;
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

  async createTest(args) {
    const { suite_id, labels_ids, fields, ...attributes } = args;

    // Handle fields parameter for custom fields
    const requestData = {
      data: {
        type: 'tests',
        attributes: {
          ...Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k.replace(/_/g, '-'), v])),
          ...(fields && { 'custom-fields': fields })
        }
      }
    };

    if (suite_id) {
      requestData.data.relationships = {
        suite: {
          data: {
            type: 'suites',
            id: suite_id
          }
        }
      };
    }

    if (labels_ids) requestData.labels_ids = labels_ids;

    const data = await this.makePostRequest('/tests', requestData);
    const formattedTest = this.formatModel(data.data, 'test', [
      'title', 'description', 'code', 'priority',
      'state', 'suite-id', 'tags', 'file'
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created test:\n\n${formattedTest}`,
        },
      ],
    };
  }

  async updateTest(args) {
    const { test_id, suite_id, labels_ids, fields, ...attributes } = args;

    // Handle fields parameter for custom fields
    const requestData = {
      data: {
        type: 'tests',
        attributes: {
          ...Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k.replace(/_/g, '-'), v])),
          ...(fields && { 'custom-fields': fields })
        }
      }
    };

    if (suite_id) {
      requestData.data.relationships = {
        suite: {
          data: {
            type: 'suites',
            id: suite_id
          }
        }
      };
    }

    if (labels_ids) requestData.labels_ids = labels_ids;

    const data = await this.makePutRequest(`/tests/${test_id}`, requestData);
    const formattedTest = this.formatModel(data.data, 'test', [
      'title', 'description', 'code', 'priority',
      'state', 'suite-id', 'tags', 'file'
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully updated test:\n\n${formattedTest}`,
        },
      ],
    };
  }

  async createSuite(args) {
    const { parent_id, fields, ...attributes } = args;
    const requestData = {
      data: {
        type: 'suites',
        attributes: {
          ...Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k.replace(/_/g, '-'), v])),
          'file-type': 'file',
          ...(fields && { 'custom-fields': fields })
        }
      }
    };

    if (parent_id) {
      requestData.data.relationships = {
        parent: {
          data: {
            type: 'suites',
            id: parent_id
          }
        }
      };
    }

    const data = await this.makePostRequest('/suites', requestData);
    const formattedSuite = this.formatModel(data.data, 'suite', [
      'title', 'description', 'test-count', 'is-root', 'file-type'
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created suite:\n\n${formattedSuite}`,
        },
      ],
    };
  }

  async createFolder(args) {
    const { parent_id, fields, ...attributes } = args;
    const requestData = {
      data: {
        type: 'suites',
        attributes: {
          ...Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k.replace(/_/g, '-'), v])),
          'file-type': 'folder',
          ...(fields && { 'custom-fields': fields })
        }
      }
    };

    if (parent_id) {
      requestData.data.relationships = {
        parent: {
          data: {
            type: 'suites',
            id: parent_id
          }
        }
      };
    }

    const data = await this.makePostRequest('/suites', requestData);
    const formattedSuite = this.formatModel(data.data, 'suite', [
      'title', 'description', 'test-count', 'is-root', 'file-type'
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created folder:\n\n${formattedSuite}`,
        },
      ],
    };
  }

  async createLabel(args) {
    const { title, color, scope, visibility, field, ...otherAttributes } = args;

    const requestData = {
      data: {
        type: 'labels',
        attributes: {
          ...Object.fromEntries(Object.entries(otherAttributes).map(([k, v]) => [k.replace(/_/g, '-'), v])),
          title,
          color,
          scope,
          visibility
        }
      }
    };

    // Add field configuration if provided
    if (field) {
      requestData.data.attributes.field = {
        type: field.type,
        ...(field.short !== undefined && { short: field.short }),
        ...(field.value && { value: field.value })
      };
    }

    const data = await this.makePostRequest('/labels', requestData);
    const formattedLabel = this.formatModel(data.data, 'label', [
      'title', 'color', 'scope', 'visibility', 'field'
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created label:\n\n${formattedLabel}`,
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

// Export the class for testing
export { TestomatioMCPServer };

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

  const token = normalizeString(options.token || process.env.TESTOMATIO_API_TOKEN);
  const projectId = normalizeString(options.project || process.env.TESTOMATIO_PROJECT_ID);
  const baseUrl = normalizeBaseUrl(
    options.baseUrl ||
      process.env.TESTOMATIO_BASE_URL ||
      'https://app.testomat.io'
  );

  if (!token) {
    console.error('Error: API token is required. Use --token <token> or set TESTOMATIO_API_TOKEN environment variable');
    process.exit(1);
  }

  if (!projectId) {
    console.error('Error: Project ID is required. Use --project <project_id> or set TESTOMATIO_PROJECT_ID environment variable');
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

// Only run main() if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
