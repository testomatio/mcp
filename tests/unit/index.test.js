import { jest } from '@jest/globals';
import { TestomatioMCPServer } from '../../index.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('TestomatioMCPServer', () => {
  let server;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      token: 'testomat_test_token_123',
      projectId: 'test-project-id',
      baseUrl: 'https://test.testomat.io'
    };

    server = new TestomatioMCPServer(mockConfig);

    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create server with correct configuration', () => {
      expect(server.config).toEqual(mockConfig);
      expect(server.jwtToken).toBeNull();
    });

    test('should initialize MCP server', () => {
      expect(server.server).toBeDefined();
      expect(server.server._serverInfo.name).toBe('testomatio-mcp-server');
    });
  });

  describe('Authentication', () => {
    test('should authenticate successfully with API token', async () => {
      const mockJwt = 'test-jwt-token-123';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ jwt: mockJwt })
      });

      const result = await server.authenticate();

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/api/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `api_token=${mockConfig.token}`,
        }
      );
      expect(result).toBe(mockJwt);
      expect(server.jwtToken).toBe(mockJwt);
    });

    test('should return cached JWT token if already authenticated', async () => {
      const mockJwt = 'cached-jwt-token';
      server.jwtToken = mockJwt;

      const result = await server.authenticate();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toBe(mockJwt);
    });

    test('should handle authentication failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Invalid credentials')
      });

      await expect(server.authenticate()).rejects.toThrow('Authentication failed: HTTP 401: Unauthorized. Response: Invalid credentials');
    });
  });

  describe('API Request Handling', () => {
    beforeEach(async () => {
      // Authenticate before making API requests
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ jwt: 'test-jwt' })
      });
      await server.authenticate();
      jest.clearAllMocks(); // Clear mock calls after authentication
    });

    test('should make GET request with correct headers', async () => {
      const mockResponse = {
        data: [
          { id: '1', attributes: { title: 'Test 1' } },
          { id: '2', attributes: { title: 'Test 2' } }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await server.makeRequest('/tests', { page: 1 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${mockConfig.baseUrl}/api/${mockConfig.projectId}/tests?page=1`),
        {
          method: 'GET',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    test('should handle JWT refresh on 401 errors', async () => {
      // First request fails with 401
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // JWT refresh call succeeds
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ jwt: 'new-jwt-token' })
      });

      // Retry request succeeds
      const mockResponse = { data: [] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await server.makeRequest('/tests');

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(server.jwtToken).toBe('new-jwt-token');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('XML Formatting', () => {
    test('should format model as XML correctly', () => {
      const model = {
        id: '123',
        attributes: {
          title: 'Test Title',
          description: 'Test Description',
          'suite-id': '456'
        }
      };

      const result = server.formatModel(model, 'test', ['title', 'suite-id']);

      expect(result).toContain('<test>');
      expect(result).toContain('<id>123</id>');
      expect(result).toContain('<title>Test Title</title>');
      expect(result).toContain('<suite-id>456</suite-id>');
      expect(result).toContain('</test>');
    });

    test('should handle special characters in XML', () => {
      const model = {
        id: '123',
        attributes: {
          title: 'Test with <special> & "characters"',
          description: 'Test with > and < symbols'
        }
      };

      const result = server.formatModel(model, 'test', ['title', 'description']);

      expect(result).toContain('&lt;special&gt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&gt;');
    });
  });

  describe('Search Parameters', () => {
    test('should build search parameters correctly', () => {
      const filters = {
        query: 'search term',
        labels: ['label1', 'label2'],
        state: 'automated',
        page: 1
      };

      const result = server.buildSearchParams(filters);

      expect(result.query).toBe('search term');
      expect(result['labels[]']).toEqual(['label1', 'label2']);
      expect(result.state).toBe('automated');
      expect(result.page).toBe('1');
    });

    test('should handle filter object parameters', () => {
      const filters = {
        filter: {
          state: 'manual',
          priority: 'high'
        }
      };

      const result = server.buildSearchParams(filters);

      expect(result['filter[state]']).toBe('manual');
      expect(result['filter[priority]']).toBe('high');
    });
  });

  describe('Tool Methods', () => {
    beforeEach(async () => {
      // Authenticate before testing tool methods
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ jwt: 'test-jwt' })
      });
      await server.authenticate();
      jest.clearAllMocks();
    });

    test('getTests should return formatted tests', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            attributes: { title: 'Test 1', state: 'automated' }
          },
          {
            id: '2',
            attributes: { title: 'Test 2', state: 'manual' }
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await server.getTests({ page: 1 });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Tests for project test-project-id');
      expect(result.content[0].text).toContain('Test 1');
      expect(result.content[0].text).toContain('Test 2');
    });

    test('createSuite should create suite with correct parameters', async () => {
      const mockResponse = {
        data: {
          id: 'suite-123',
          attributes: {
            title: 'New Test Suite',
            description: 'Test Description',
            'file-type': 'file'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const suiteData = {
        title: 'New Test Suite',
        description: 'Test Description'
      };

      const result = await server.createSuite(suiteData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/suites'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"file-type":"file"')
        })
      );

      expect(result.content[0].text).toContain('Successfully created suite');
      expect(result.content[0].text).toContain('New Test Suite');
    });

    test('createFolder should create folder with correct file_type', async () => {
      const mockResponse = {
        data: {
          id: 'folder-123',
          attributes: {
            title: 'New Folder',
            description: 'Folder Description',
            'file-type': 'folder'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const folderData = {
        title: 'New Folder',
        description: 'Folder Description'
      };

      const result = await server.createFolder(folderData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/suites'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"file-type":"folder"')
        })
      );

      expect(result.content[0].text).toContain('Successfully created folder');
      expect(result.content[0].text).toContain('New Folder');
    });

    test('createLabel should create label with correct parameters', async () => {
      const mockResponse = {
        data: {
          id: 'label-123',
          attributes: {
            title: 'Severity',
            color: '#ffe9ad',
            scope: ['tests', 'suites'],
            visibility: ['list']
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const labelData = {
        title: 'Severity',
        color: '#ffe9ad',
        scope: ['tests', 'suites'],
        visibility: ['list']
      };

      const result = await server.createLabel(labelData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/labels'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"title":"Severity"')
        })
      );

      expect(result.content[0].text).toContain('Successfully created label');
      expect(result.content[0].text).toContain('Severity');
    });

    test('createLabel should create label with custom field configuration', async () => {
      const mockResponse = {
        data: {
          id: 'label-456',
          attributes: {
            title: 'Priority',
            color: '#ff6b6b',
            scope: ['tests'],
            visibility: ['list'],
            field: {
              type: 'list',
              short: true,
              value: '⛔ Blocker\n⚠️ Critical\n🔥 Major\n👌 Normal\n❄️ Minor\n💤 Trivial'
            }
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const labelData = {
        title: 'Priority',
        color: '#ff6b6b',
        scope: ['tests'],
        visibility: ['list'],
        field: {
          type: 'list',
          short: true,
          value: '⛔ Blocker\n⚠️ Critical\n🔥 Major\n👌 Normal\n❄️ Minor\n💤 Trivial'
        }
      };

      const result = await server.createLabel(labelData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/labels'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"field":{"type":"list","short":true,"value"')
        })
      );

      expect(result.content[0].text).toContain('Successfully created label');
      expect(result.content[0].text).toContain('Priority');
    });

    test('createLabel should handle label with minimal required fields', async () => {
      const mockResponse = {
        data: {
          id: 'label-789',
          attributes: {
            title: 'Simple Label'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const labelData = {
        title: 'Simple Label'
      };

      const result = await server.createLabel(labelData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/labels'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"title":"Simple Label"')
        })
      );

      expect(result.content[0].text).toContain('Successfully created label');
      expect(result.content[0].text).toContain('Simple Label');
    });

    test('updateTest should update test priority', async () => {
      const mockResponse = {
        data: {
          id: 'test-123',
          attributes: {
            title: 'Test Title',
            priority: 'high',
            state: 'automated'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const updateData = {
        test_id: 'test-123',
        priority: 'high'
      };

      const result = await server.updateTest(updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tests/test-123'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"priority":"high"')
        })
      );

      expect(result.content[0].text).toContain('Successfully updated test');
      expect(result.content[0].text).toContain('<priority>high</priority>');
    });
  });
});