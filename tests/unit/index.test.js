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

    test('should normalize whitespace in config values', () => {
      const serverWithWhitespace = new TestomatioMCPServer({
        token: '  testomat_test_token_123  ',
        projectId: '\n  test-project-id  \n',
        baseUrl: 'http://\n  localhost:3000',
      });

      expect(serverWithWhitespace.config.token).toBe('testomat_test_token_123');
      expect(serverWithWhitespace.config.projectId).toBe('test-project-id');
      expect(serverWithWhitespace.config.baseUrl).toBe('http://localhost:3000');
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

  describe('Label Setting Functionality', () => {
    beforeEach(async () => {
      // Authenticate before testing label methods
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ jwt: 'test-jwt' })
      });
      await server.authenticate();
      jest.clearAllMocks();
    });

    describe('createTest with labels_ids', () => {
      test('should create test with label:value format labels', async () => {
        const mockResponse = {
          data: {
            id: 'test-123',
            attributes: {
              title: 'Test with Labels',
              state: 'automated',
              priority: 'high'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Labels',
          labels_ids: ['priority:high', 'severity:critical', 'type:regression']
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Authorization': 'test-jwt',
              'Content-Type': 'application/json'
            },
            body: expect.stringContaining('"data":{"type":"tests","attributes":{')
          })
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"labels_ids":["priority:high","severity:critical","type:regression"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
        expect(result.content[0].text).toContain('Test with Labels');
      });

      test('should create test with simple labels (no values)', async () => {
        const mockResponse = {
          data: {
            id: 'test-124',
            attributes: {
              title: 'Test with Simple Labels',
              state: 'manual'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Simple Labels',
          labels_ids: ['smoke', 'ui', 'api']
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"labels_ids":["smoke","ui","api"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });

      test('should create test with mixed label formats', async () => {
        const mockResponse = {
          data: {
            id: 'test-125',
            attributes: {
              title: 'Test with Mixed Labels'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Mixed Labels',
          labels_ids: ['smoke', 'priority:high', 'team:backend']
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"labels_ids":["smoke","priority:high","team:backend"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });
    });

    describe('Tag extraction and merging', () => {
      test('should extract tags from title with @ symbols', () => {
        const title = '@smoke @regression test with @critical priority';
        const tags = server.extractTagsFromTitle(title);

        expect(tags).toEqual(['smoke', 'regression', 'critical']);
      });

      test('should handle title without tags', () => {
        const title = 'Simple test title';
        const tags = server.extractTagsFromTitle(title);

        expect(tags).toEqual([]);
      });

      test('should handle empty title', () => {
        const tags = server.extractTagsFromTitle('');
        expect(tags).toEqual([]);
      });

      test('should merge tags from explicit and title sources', () => {
        const explicitTags = ['smoke', 'api'];
        const titleTags = ['regression', 'smoke']; // smoke appears in both
        const merged = server.mergeTags(explicitTags, titleTags);

        expect(merged).toEqual(['smoke', 'api', 'regression']);
      });

      test('should handle tags with @ prefix in explicit array', () => {
        const explicitTags = ['@frontend', 'backend', '@ui'];
        const titleTags = ['api'];
        const merged = server.mergeTags(explicitTags, titleTags);

        expect(merged).toEqual(['frontend', 'backend', 'ui', 'api']);
      });

      test('should handle duplicate tags from title', () => {
        const title = '@smoke test with @smoke tag duplicate';
        const tags = server.extractTagsFromTitle(title);

        expect(tags).toEqual(['smoke']);
      });

      test('should handle special characters in tags', () => {
        const title = '@smoke-test @regression_v2 @api-integration';
        const tags = server.extractTagsFromTitle(title);

        expect(tags).toEqual(['smoke-test', 'regression_v2', 'api-integration']);
      });
    });

    describe('createTest with tags', () => {
      test('should create test with tags from title', async () => {
        const mockResponse = {
          data: {
            id: 'test-123',
            attributes: {
              title: '@smoke @regression test title',
              state: 'automated'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: '@smoke @regression test title'
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"tags":["smoke","regression"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });

      test('should create test with explicit tags', async () => {
        const mockResponse = {
          data: {
            id: 'test-124',
            attributes: {
              title: 'Test with explicit tags',
              state: 'manual'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with explicit tags',
          tags: ['smoke', 'api']
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"tags":["smoke","api"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });

      test('should create test with merged tags from title and explicit', async () => {
        const mockResponse = {
          data: {
            id: 'test-125',
            attributes: {
              title: '@smoke test with both tag types'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: '@smoke test with both tag types',
          tags: ['api', 'regression']
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"tags":["api","regression","smoke"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });
    });

    describe('updateTest with tags', () => {
      test('should update test with tags from title', async () => {
        const mockResponse = {
          data: {
            id: 'test-126',
            attributes: {
              title: '@critical updated test title'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const updateData = {
          test_id: 'test-126',
          title: '@critical updated test title'
        };

        const result = await server.updateTest(updateData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests/test-126'),
          expect.objectContaining({
            body: expect.stringContaining('"tags":["critical"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully updated test');
      });

      test('should update test with explicit tags', async () => {
        const mockResponse = {
          data: {
            id: 'test-127',
            attributes: {
              title: 'Updated test title'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const updateData = {
          test_id: 'test-127',
          title: 'Updated test title',
          tags: ['frontend', 'ui']
        };

        const result = await server.updateTest(updateData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests/test-127'),
          expect.objectContaining({
            body: expect.stringContaining('"tags":["frontend","ui"]')
          })
        );

        expect(result.content[0].text).toContain('Successfully updated test');
      });

      test('should update test without tags when not provided', async () => {
        const mockResponse = {
          data: {
            id: 'test-128',
            attributes: {
              title: 'Updated test title without tags'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const updateData = {
          test_id: 'test-128',
          title: 'Updated test title without tags'
        };

        const result = await server.updateTest(updateData);

        const callArgs = global.fetch.mock.calls[0];
        const bodyString = callArgs[1].body;

        expect(callArgs[0]).toContain('/tests/test-128');
        // Check that 'attributes' doesn't contain 'tags' field
        const bodyObj = JSON.parse(bodyString);
        expect(bodyObj.data.attributes).not.toHaveProperty('tags');

        expect(result.content[0].text).toContain('Successfully updated test');
      });
    });

    describe('createTest with fields parameter', () => {
      test('should create test with custom fields', async () => {
        const mockResponse = {
          data: {
            id: 'test-126',
            attributes: {
              title: 'Test with Custom Fields'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Custom Fields',
          fields: {
            priority: 'critical',
            severity: 'high',
            team: 'frontend',
            risk_score: '8.5'
          }
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"custom-fields":{"priority":"critical","severity":"high","team":"frontend","risk_score":"8.5"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });

      test('should create test with both labels_ids and fields', async () => {
        const mockResponse = {
          data: {
            id: 'test-127',
            attributes: {
              title: 'Test with Both Label Types'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Both Label Types',
          labels_ids: ['smoke', 'regression'],
          fields: {
            priority: 'high',
            severity: 'critical'
          }
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"labels_ids":["smoke","regression"]')
          })
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"custom-fields":{"priority":"high","severity":"critical"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });
    });

    describe('updateTest with labels_ids', () => {
      test('should update test with labels using label linking API', async () => {
        // Mock the PUT request for test update (empty since only labels are being updated)
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            data: {
              id: 'test-128',
              attributes: { title: 'Test Title' }
            }
          })
        });

        // Mock the first label link call
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        // Mock the second label link call
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        // Mock the get test call after label update
        const mockTestResponse = {
          data: {
            id: 'test-128',
            attributes: {
              title: 'Updated Test with Labels'
            }
          }
        };
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTestResponse)
        });

        const updateData = {
          test_id: 'test-128',
          labels_ids: ['priority:high', 'severity:critical']
        };

        const result = await server.updateTest(updateData);

        // Should first update test attributes using JSON-API format (PUT request)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests/test-128'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"data":{"id":"test-128","type":"tests","attributes":{')
          })
        );

        // Should call label link endpoint for first label with value
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/priority/link?test_id=test-128&value=high'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Authorization': 'test-jwt',
              'Content-Type': 'application/json'
            },
            body: '{}'
          })
        );

        // Should call label link endpoint for second label with value
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/severity/link?test_id=test-128&value=critical'),
          expect.objectContaining({
            method: 'POST',
            body: '{}'
          })
        );

        // Should then fetch the updated test
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests/test-128'),
          expect.objectContaining({
            method: 'GET'
          })
        );

        expect(result.content[0].text).toContain('Successfully updated test');
      });

      test('should update test with labels without values', async () => {
        // Mock the PUT request for test update (empty since only labels are being updated)
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            data: {
              id: 'test-129',
              attributes: { title: 'Test Title' }
            }
          })
        });

        // Mock the label link call for simple label
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        // Mock the get test call after label update
        const mockTestResponse = {
          data: {
            id: 'test-129',
            attributes: {
              title: 'Updated Test with Simple Label'
            }
          }
        };
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTestResponse)
        });

        const updateData = {
          test_id: 'test-129',
          labels_ids: ['smoke']
        };

        const result = await server.updateTest(updateData);

        // Should call label link endpoint for simple label without value
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/smoke/link?test_id=test-129'),
          expect.objectContaining({
            method: 'POST',
            body: '{}'
          })
        );

        expect(result.content[0].text).toContain('Successfully updated test');
      });

      test('should update test with regular attributes and custom fields', async () => {
        const mockResponse = {
          data: {
            id: 'test-129',
            attributes: {
              title: 'Updated Test',
              priority: 'high',
              description: 'Updated description'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const updateData = {
          test_id: 'test-129',
          title: 'Updated Test',
          priority: 'high',
          fields: {
            severity: 'critical',
            team: 'backend'
          }
        };

        const result = await server.updateTest(updateData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests/test-129'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"data":{"id":"test-129","type":"tests","attributes":{')
          })
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests/test-129'),
          expect.objectContaining({
            body: expect.stringContaining('"custom-fields":{"severity":"critical","team":"backend"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully updated test');
      });
    });

    describe('createSuite with fields parameter', () => {
      test('should create suite with custom fields', async () => {
        const mockResponse = {
          data: {
            id: 'suite-123',
            attributes: {
              title: 'Suite with Fields',
              'file-type': 'file'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const suiteData = {
          title: 'Suite with Fields',
          fields: {
            team: 'frontend',
            component: 'user-auth',
            priority: 'high'
          }
        };

        const result = await server.createSuite(suiteData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/suites'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"custom-fields":{"team":"frontend","component":"user-auth","priority":"high"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created suite');
      });

      test('should create suite with parent and fields', async () => {
        const mockResponse = {
          data: {
            id: 'suite-124',
            attributes: {
              title: 'Child Suite with Fields',
              'file-type': 'file'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const suiteData = {
          title: 'Child Suite with Fields',
          parent_id: 'parent-suite-456',
          fields: {
            team: 'backend',
            module: 'api'
          }
        };

        const result = await server.createSuite(suiteData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/suites'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"custom-fields":{"team":"backend","module":"api"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created suite');
      });
    });

    describe('createFolder with fields parameter', () => {
      test('should create folder with custom fields', async () => {
        const mockResponse = {
          data: {
            id: 'folder-123',
            attributes: {
              title: 'Folder with Fields',
              'file-type': 'folder'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const folderData = {
          title: 'Folder with Fields',
          fields: {
            department: 'qa',
            product: 'mobile-app',
            environment: 'staging'
          }
        };

        const result = await server.createFolder(folderData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/suites'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"file-type":"folder"')
          })
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/suites'),
          expect.objectContaining({
            body: expect.stringContaining('"custom-fields":{"department":"qa","product":"mobile-app","environment":"staging"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created folder');
      });
    });

    describe('getLabels functionality', () => {
      test('should get all labels without filters', async () => {
        const mockResponse = {
          data: [
            {
              id: 'label-123',
              attributes: {
                title: 'Priority',
                color: '#ff6b6b',
                scope: ['tests', 'suites'],
                visibility: ['list']
              }
            },
            {
              id: 'label-456',
              attributes: {
                title: 'Severity',
                color: '#ffe9ad',
                scope: ['tests'],
                visibility: ['list']
              }
            }
          ]
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const result = await server.getLabels();

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            method: 'GET',
            headers: {
              'Authorization': 'test-jwt',
              'Content-Type': 'application/json'
            }
          })
        );

        expect(result.content[0].text).toContain('Available labels for project test-project-id');
        expect(result.content[0].text).toContain('Priority');
        expect(result.content[0].text).toContain('Severity');
        expect(result.content[0].text).toContain('label-123');
        expect(result.content[0].text).toContain('label-456');
      });

      test('should get labels with scope filter', async () => {
        const mockResponse = {
          data: [
            {
              id: 'label-789',
              attributes: {
                title: 'Component',
                color: '#4ecdc4',
                scope: ['tests'],
                visibility: ['list']
              }
            }
          ]
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const filters = {
          scope: ['tests']
        };

        const result = await server.getLabels(filters);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels?scope%5B%5D=tests'),
          expect.objectContaining({
            method: 'GET'
          })
        );

        expect(result.content[0].text).toContain('Component');
        expect(result.content[0].text).toContain('label-789');
      });

      test('should get labels with multiple scope filter', async () => {
        const mockResponse = {
          data: [
            {
              id: 'label-101',
              attributes: {
                title: 'Team',
                color: '#95e1d3',
                scope: ['tests', 'suites'],
                visibility: ['list']
              }
            }
          ]
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const filters = {
          scope: ['tests', 'suites']
        };

        const result = await server.getLabels(filters);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels?scope%5B%5D=tests&scope%5B%5D=suites'),
          expect.objectContaining({
            method: 'GET'
          })
        );

        expect(result.content[0].text).toContain('Team');
      });

      test('should get labels with pagination', async () => {
        const mockResponse = {
          data: [
            {
              id: 'label-202',
              attributes: {
                title: 'Environment',
                color: '#f8b500',
                scope: ['tests'],
                visibility: ['list']
              }
            }
          ]
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const filters = {
          page: 2
        };

        const result = await server.getLabels(filters);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels?page=2'),
          expect.objectContaining({
            method: 'GET'
          })
        );

        expect(result.content[0].text).toContain('Environment');
      });

      test('should handle empty labels response', async () => {
        const mockResponse = {
          data: []
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const result = await server.getLabels();

        expect(result.content[0].text).toContain('Available labels for project test-project-id');
        expect(result.content[0].text).toContain('No labels found matching the criteria');
      });
    });

    describe('unlinkLabel functionality', () => {
      test('should remove label from test without value', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        const unlinkData = {
          label_id: 'priority',
          test_id: 'test-123'
        };

        const result = await server.unlinkLabel(unlinkData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/priority/link?test_id=test-123&event=remove'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Authorization': 'test-jwt',
              'Content-Type': 'application/json'
            },
            body: '{}'
          })
        );

        expect(result.content[0].text).toContain('Successfully removed label "priority" (all instances) from test "test-123"');
      });

      test('should remove label from test with specific value', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        const unlinkData = {
          label_id: 'severity',
          test_id: 'test-456',
          value: 'critical'
        };

        const result = await server.unlinkLabel(unlinkData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/severity/link?test_id=test-456&event=remove&value=critical'),
          expect.objectContaining({
            method: 'POST',
            body: '{}'
          })
        );

        expect(result.content[0].text).toContain('Successfully removed label "severity" (value "critical") from test "test-456"');
      });

      test('should remove label from suite without value', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        const unlinkData = {
          label_id: 'component',
          suite_id: 'suite-789'
        };

        const result = await server.unlinkLabel(unlinkData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/component/link?suite_id=suite-789&event=remove'),
          expect.objectContaining({
            method: 'POST',
            body: '{}'
          })
        );

        expect(result.content[0].text).toContain('Successfully removed label "component" (all instances) from suite "suite-789"');
      });

      test('should remove label from suite with specific value', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        const unlinkData = {
          label_id: 'team',
          suite_id: 'suite-101',
          value: 'backend'
        };

        const result = await server.unlinkLabel(unlinkData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/team/link?suite_id=suite-101&event=remove&value=backend'),
          expect.objectContaining({
            method: 'POST',
            body: '{}'
          })
        );

        expect(result.content[0].text).toContain('Successfully removed label "team" (value "backend") from suite "suite-101"');
      });

      test('should handle special characters in label values', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });

        const unlinkData = {
          label_id: 'status',
          test_id: 'test-202',
          value: 'in-progress & testing'
        };

        const result = await server.unlinkLabel(unlinkData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels/status/link?test_id=test-202&event=remove&value=in-progress%20%26%20testing'),
          expect.objectContaining({
            method: 'POST'
          })
        );

        expect(result.content[0].text).toContain('Successfully removed label "status" (value "in-progress & testing") from test "test-202"');
      });

      test('should throw error when neither test_id nor suite_id is provided', async () => {
        const unlinkData = {
          label_id: 'priority'
        };

        await expect(server.unlinkLabel(unlinkData)).rejects.toThrow('Either test_id or suite_id must be provided');
      });

      test('should throw error when both test_id and suite_id are provided', async () => {
        const unlinkData = {
          label_id: 'priority',
          test_id: 'test-123',
          suite_id: 'suite-456'
        };

        await expect(server.unlinkLabel(unlinkData)).rejects.toThrow('Cannot specify both test_id and suite_id. Use one or the other.');
      });
    });

    describe('createLabel with field configuration', () => {
      test('should create label with list field type', async () => {
        const mockResponse = {
          data: {
            id: 'label-123',
            attributes: {
              title: 'Priority',
              field: {
                type: 'list',
                value: 'Low\nNormal\nHigh\nCritical'
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
          field: {
            type: 'list',
            value: 'Low\nNormal\nHigh\nCritical'
          }
        };

        const result = await server.createLabel(labelData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"field":{"type":"list","value":"Low\\nNormal\\nHigh\\nCritical"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created label');
      });

      test('should create label with string field type', async () => {
        const mockResponse = {
          data: {
            id: 'label-124',
            attributes: {
              title: 'Assignee',
              field: {
                type: 'string'
              }
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const labelData = {
          title: 'Assignee',
          field: {
            type: 'string'
          }
        };

        const result = await server.createLabel(labelData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"field":{"type":"string"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created label');
      });

      test('should create label with number field type', async () => {
        const mockResponse = {
          data: {
            id: 'label-125',
            attributes: {
              title: 'Risk Score',
              field: {
                type: 'number',
                short: false
              }
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const labelData = {
          title: 'Risk Score',
          field: {
            type: 'number',
            short: false
          }
        };

        const result = await server.createLabel(labelData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"field":{"type":"number","short":false}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created label');
      });

      test('should create label with complete configuration', async () => {
        const mockResponse = {
          data: {
            id: 'label-126',
            attributes: {
              title: 'Component',
              color: '#ff6b6b',
              scope: ['tests', 'suites'],
              visibility: ['list'],
              field: {
                type: 'list',
                short: true,
                value: 'Frontend\nBackend\nDatabase\nAPI'
              }
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const labelData = {
          title: 'Component',
          color: '#ff6b6b',
          scope: ['tests', 'suites'],
          visibility: ['list'],
          field: {
            type: 'list',
            short: true,
            value: 'Frontend\nBackend\nDatabase\nAPI'
          }
        };

        const result = await server.createLabel(labelData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"title":"Component"')
          })
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            body: expect.stringContaining('"color":"#ff6b6b"')
          })
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            body: expect.stringContaining('"scope":["tests","suites"]')
          })
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/labels'),
          expect.objectContaining({
            body: expect.stringContaining('"field":{"type":"list","short":true,"value":"Frontend\\nBackend\\nDatabase\\nAPI"}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created label');
      });
    });

    describe('Edge cases and error handling', () => {
      test('should handle empty labels_ids array', async () => {
        const mockResponse = {
          data: {
            id: 'test-130',
            attributes: {
              title: 'Test with Empty Labels'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Empty Labels',
          labels_ids: []
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"labels_ids":[]')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });

      test('should handle empty fields object', async () => {
        const mockResponse = {
          data: {
            id: 'test-131',
            attributes: {
              title: 'Test with Empty Fields'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Empty Fields',
          fields: {}
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"custom-fields":{}')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });

      test('should handle special characters in field values', async () => {
        const mockResponse = {
          data: {
            id: 'test-132',
            attributes: {
              title: 'Test with Special Characters'
            }
          }
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const testData = {
          suite_id: 'suite-456',
          title: 'Test with Special Characters',
          fields: {
            description: 'Test with "quotes" and <tags>',
            notes: 'Special characters: & <>',
            regex: '[a-z]+@[0-9]+'
          }
        };

        const result = await server.createTest(testData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/tests'),
          expect.objectContaining({
            body: expect.stringContaining('"custom-fields"')
          })
        );

        expect(result.content[0].text).toContain('Successfully created test');
      });
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

    test('getTest should fetch a specific test with all details', async () => {
      const mockResponse = {
        data: {
          id: 'Ta1b2c3d4',
          attributes: {
            title: 'Login Test',
            description: 'Test user login functionality',
            code: 'test("should login user", () => { ... });',
            priority: 'high',
            state: 'automated',
            'suite-id': 'Sx9y8z7w6',
            tags: ['smoke', 'authentication'],
            file: 'tests/login.test.js',
            'jira-issues': ['PROJ-123', 'PROJ-456'],
            'assigned-to': 'john.doe@example.com',
            'created-at': '2024-01-15T10:30:00Z',
            'updated-at': '2024-01-20T14:45:00Z',
            labels: [
              {
                id: 'priority',
                attributes: {
                  title: 'Priority',
                  value: 'high'
                }
              },
              {
                id: 'severity',
                attributes: {
                  title: 'Severity',
                  value: 'critical'
                }
              }
            ]
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await server.getTest('Ta1b2c3d4');

      // Verify the correct endpoint was called with labels and detail parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tests/Ta1b2c3d4?labels=true&detail=true'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'test-jwt',
            'Content-Type': 'application/json'
          }
        })
      );

      // Verify response structure
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Test Ta1b2c3d4:');

      // Verify all test details are included in the formatted output
      expect(result.content[0].text).toContain('<title>Login Test</title>');
      expect(result.content[0].text).toContain('<description>Test user login functionality</description>');
      expect(result.content[0].text).toContain('<priority>high</priority>');
      expect(result.content[0].text).toContain('<state>automated</state>');
      expect(result.content[0].text).toContain('<suite-id>Sx9y8z7w6</suite-id>');
      expect(result.content[0].text).toContain('<file>tests/login.test.js</file>');
      expect(result.content[0].text).toContain('<tag>smoke</tag>');
      expect(result.content[0].text).toContain('<tag>authentication</tag>');
      expect(result.content[0].text).toContain('<jira-issues><item>PROJ-123</item><item>PROJ-456</item></jira-issues>');
      expect(result.content[0].text).toContain('<assigned-to>john.doe@example.com</assigned-to>');
      expect(result.content[0].text).toContain('<created-at>2024-01-15T10:30:00Z</created-at>');
      expect(result.content[0].text).toContain('<updated-at>2024-01-20T14:45:00Z</updated-at>');
    });

    test('getTest should handle test with minimal data', async () => {
      const mockResponse = {
        data: {
          id: 'Tb2c3d4e5',
          attributes: {
            title: 'Simple Test',
            state: 'manual'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await server.getTest('Tb2c3d4e5');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tests/Tb2c3d4e5?labels=true&detail=true'),
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(result.content[0].text).toContain('Test Tb2c3d4e5:');
      expect(result.content[0].text).toContain('<title>Simple Test</title>');
      expect(result.content[0].text).toContain('<state>manual</state>');
    });

    test('getTest should handle empty labels array', async () => {
      const mockResponse = {
        data: {
          id: 'Tc3d4e5f6',
          attributes: {
            title: 'Test without labels',
            state: 'automated',
            labels: []
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await server.getTest('Tc3d4e5f6');

      expect(result.content[0].text).toContain('Test Tc3d4e5f6:');
      expect(result.content[0].text).toContain('<title>Test without labels</title>');
      // Should not contain any label elements
      expect(result.content[0].text).not.toContain('<label>');
    });

    test('getTest should escape special characters in XML output', async () => {
      const mockResponse = {
        data: {
          id: 'Td4e5f6g7',
          attributes: {
            title: 'Test with <special> & "characters"',
            description: 'Description with > and < symbols & ampersands',
            state: 'automated'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await server.getTest('Td4e5f6g7');

      expect(result.content[0].text).toContain('Test with &lt;special&gt; &amp; &quot;characters&quot;');
      expect(result.content[0].text).toContain('Description with &gt; and &lt; symbols &amp; ampersands');
    });
  });
});
