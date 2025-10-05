import { jest } from '@jest/globals';
import { TestomatioMCPServer } from '../../index.js';
import dotenv from 'dotenv';

// Load environment variables for integration tests
dotenv.config();

describe('TestomatioMCPServer Integration Tests', () => {
  let server;
  let realConfig;

  beforeAll(() => {
    // Check if we have required environment variables for integration tests
    const apiToken = process.env.TESTOMATIO_API_TOKEN;
    const projectId = process.env.TESTOMATIO_PROJECT_ID;
    const baseUrl = process.env.TESTOMATIO_BASE_URL || 'https://app.testomat.io';

    if (!apiToken || !projectId) {
      console.warn('⚠️  Skipping integration tests - missing TESTOMATIO_API_TOKEN or TESTOMATIO_PROJECT_ID');
      return;
    }

    realConfig = {
      token: apiToken,
      projectId: projectId,
      baseUrl: baseUrl
    };

    server = new TestomatioMCPServer(realConfig);
  });

  // Skip all tests if we don't have proper credentials
  describe.skip('when credentials are not configured', () => {
    test('should skip integration tests', () => {
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Authentication Integration', () => {
    test('should authenticate with real Testomatio API', async () => {
      if (!realConfig) return; // Skip if no config

      console.log('\n[DEBUG] Testing authentication with:', realConfig.baseUrl);
      const jwt = await server.authenticate();

      console.log('[DEBUG] Authentication successful, JWT length:', jwt.length);
      console.log('[DEBUG] JWT token preview:', jwt.substring(0, 20) + '...');

      expect(jwt).toBeDefined();
      expect(typeof jwt).toBe('string');
      expect(jwt.length).toBeGreaterThan(0);
      expect(server.jwtToken).toBe(jwt);
    }, 30000); // 30 second timeout for API calls

    test('should reuse cached JWT token', async () => {
      if (!realConfig) return; // Skip if no config

      // First authentication
      const jwt1 = await server.authenticate();

      // Second authentication should reuse token
      const jwt2 = await server.authenticate();

      expect(jwt1).toBe(jwt2);
    }, 30000);
  });

  describe('API Requests Integration', () => {
    beforeAll(async () => {
      if (realConfig) {
        await server.authenticate(); // Ensure we're authenticated
      }
    });

    test('should fetch real tests from API', async () => {
      if (!realConfig) return; // Skip if no config

      console.log('\n[DEBUG] Fetching tests with params: { page: 1, limit: 5 }');
      const result = await server.getTests({ page: 1, limit: 5 });

      console.log('[DEBUG] Raw API response structure:', JSON.stringify(result, null, 2));
      console.log('[DEBUG] Response content length:', result.content[0].text.length);
      console.log('[DEBUG] First 500 chars of response:', result.content[0].text.substring(0, 500));

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Tests for project');

      // Should contain XML-formatted test data
      const textContent = result.content[0].text;
      expect(textContent).toContain('<test>');
      expect(textContent).toContain('</test>');
    }, 30000);

    test('should fetch real suites from API', async () => {
      if (!realConfig) return; // Skip if no config

      console.log('\n[DEBUG] Fetching suites with params: { page: 1, limit: 5 }');
      const result = await server.searchSuites({ page: 1, limit: 5 });

      console.log('[DEBUG] Raw API response structure:', JSON.stringify(result, null, 2));
      console.log('[DEBUG] Response content length:', result.content[0].text.length);
      console.log('[DEBUG] First 500 chars of response:', result.content[0].text.substring(0, 500));

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Search results for suites');

      // Should contain XML-formatted suite data
      const textContent = result.content[0].text;
      expect(textContent).toContain('<suite>');
      expect(textContent).toContain('</suite>');
    }, 30000);

    test('should fetch real test runs from API', async () => {
      if (!realConfig) return; // Skip if no config

      console.log('\n[DEBUG] Fetching test runs with params: { page: 1, limit: 5 }');
      const result = await server.getRuns({ page: 1, limit: 5 });

      console.log('[DEBUG] Raw API response structure:', JSON.stringify(result, null, 2));
      console.log('[DEBUG] Response content length:', result.content[0].text.length);
      console.log('[DEBUG] First 500 chars of response:', result.content[0].text.substring(0, 500));

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Test runs for project');

      // Should contain XML-formatted run data
      const textContent = result.content[0].text;
      expect(textContent).toContain('<run>');
      expect(textContent).toContain('</run>');
    }, 30000);

    test('should handle API errors gracefully', async () => {
      if (!realConfig) return; // Skip if no config

      // Try to access a non-existent resource
      await expect(server.makeRequest('/nonexistent', {})).rejects.toThrow();
    }, 30000);
  });

  describe('Suite/Folder Creation Integration', () => {
    let createdSuiteId;
    let createdFolderId;

    beforeAll(async () => {
      if (realConfig) {
        await server.authenticate(); // Ensure we're authenticated
      }
    });

    afterAll(async () => {
      // Cleanup created test data if we have credentials
      if (realConfig && createdSuiteId) {
        try {
          await server.makeRequest(`/suites/${createdSuiteId}`, {}, 'DELETE');
        } catch (error) {
          console.warn('Failed to cleanup test suite:', error.message);
        }
      }
      if (realConfig && createdFolderId) {
        try {
          await server.makeRequest(`/suites/${createdFolderId}`, {}, 'DELETE');
        } catch (error) {
          console.warn('Failed to cleanup test folder:', error.message);
        }
      }
    });

    test('should create a real suite via API', async () => {
      if (!realConfig) return; // Skip if no config

      const suiteData = {
        title: `Integration Test Suite ${Date.now()}`,
        description: 'Suite created during integration testing'
      };

      console.log('\n[DEBUG] Creating suite with data:', JSON.stringify(suiteData, null, 2));
      const result = await server.createSuite(suiteData);

      console.log('[DEBUG] Suite creation response:', JSON.stringify(result, null, 2));
      console.log('[DEBUG] Full response text:', result.content[0].text);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Successfully created suite');
      expect(result.content[0].text).toContain(suiteData.title);

      // Extract suite ID from response for cleanup
      const match = result.content[0].text.match(/ID: ([a-f0-9-]+)/);
      if (match) {
        createdSuiteId = match[1];
        console.log('[DEBUG] Extracted suite ID for cleanup:', createdSuiteId);
      }
    }, 30000);

    test('should create a real folder via API', async () => {
      if (!realConfig) return; // Skip if no config

      const folderData = {
        title: `Integration Test Folder ${Date.now()}`,
        description: 'Folder created during integration testing'
      };

      console.log('\n[DEBUG] Creating folder with data:', JSON.stringify(folderData, null, 2));
      const result = await server.createFolder(folderData);

      console.log('[DEBUG] Folder creation response:', JSON.stringify(result, null, 2));
      console.log('[DEBUG] Full response text:', result.content[0].text);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Successfully created folder');
      expect(result.content[0].text).toContain(folderData.title);

      // Extract folder ID from response for cleanup
      const match = result.content[0].text.match(/ID: ([a-f0-9-]+)/);
      if (match) {
        createdFolderId = match[1];
        console.log('[DEBUG] Extracted folder ID for cleanup:', createdFolderId);
      }
    }, 30000);
  });

  describe('Label Creation Integration', () => {
    let createdLabelId;

    beforeAll(async () => {
      if (realConfig) {
        await server.authenticate(); // Ensure we're authenticated
      }
    });

    afterAll(async () => {
      // Cleanup created test data if we have credentials
      if (realConfig && createdLabelId) {
        try {
          await server.makeRequest(`/labels/${createdLabelId}`, {}, 'DELETE');
        } catch (error) {
          console.warn('Failed to cleanup test label:', error.message);
        }
      }
    });

    test('should create a simple label via API', async () => {
      if (!realConfig) return; // Skip if no config

      const labelData = {
        title: `Integration Test Label ${Date.now()}`,
        color: '#ff9999',
        scope: ['tests'],
        visibility: ['list']
      };

      console.log('\n[DEBUG] Creating simple label with data:', JSON.stringify(labelData, null, 2));
      const result = await server.createLabel(labelData);

      console.log('[DEBUG] Label creation response:', JSON.stringify(result, null, 2));
      console.log('[DEBUG] Full response text:', result.content[0].text);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Successfully created label');
      expect(result.content[0].text).toContain(labelData.title);

      // Extract label ID from response for cleanup
      const match = result.content[0].text.match(/ID: ([a-f0-9-]+)/);
      if (match) {
        createdLabelId = match[1];
        console.log('[DEBUG] Extracted label ID for cleanup:', createdLabelId);
      }
    }, 30000);

    test('should create a label with custom field via API', async () => {
      if (!realConfig) return; // Skip if no config

      const labelData = {
        title: `Integration Test Priority ${Date.now()}`,
        color: '#ffe9ad',
        scope: ['tests', 'suites'],
        visibility: ['list'],
        field: {
          type: 'list',
          short: true,
          value: '⛔ Blocker\n⚠️ Critical\n🔥 Major\n👌 Normal\n❄️ Minor\n💤 Trivial'
        }
      };

      console.log('\n[DEBUG] Creating label with custom field:', JSON.stringify(labelData, null, 2));
      const result = await server.createLabel(labelData);

      console.log('[DEBUG] Label with field creation response:', JSON.stringify(result, null, 2));
      console.log('[DEBUG] Full response text:', result.content[0].text);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Successfully created label');
      expect(result.content[0].text).toContain(labelData.title);

      // Extract label ID from response for cleanup (if different from the first one)
      const match = result.content[0].text.match(/ID: ([a-f0-9-]+)/);
      if (match && match[1] !== createdLabelId) {
        // Clean up this additional label
        try {
          await server.makeRequest(`/labels/${match[1]}`, {}, 'DELETE');
          console.log('[DEBUG] Cleaned up additional label ID:', match[1]);
        } catch (error) {
          console.warn('Failed to cleanup additional test label:', error.message);
        }
      }
    }, 30000);
  });

  describe('XML Formatting with Real Data', () => {
    test('should format real API response data as XML', async () => {
      if (!realConfig) return; // Skip if no config

      // Get real data first
      console.log('\n[DEBUG] Making direct API request to /tests for raw data');
      const apiResponse = await server.makeRequest('/tests', { page: 1, limit: 1 });

      console.log('[DEBUG] Raw API response:', JSON.stringify(apiResponse, null, 2));

      if (apiResponse.data && apiResponse.data.length > 0) {
        const testModel = apiResponse.data[0];
        console.log('[DEBUG] Test model to format:', JSON.stringify(testModel, null, 2));

        const xmlOutput = server.formatModel(testModel, 'test', ['title', 'state', 'created']);
        console.log('[DEBUG] XML formatted output:', xmlOutput);

        expect(xmlOutput).toContain('<test>');
        expect(xmlOutput).toContain(`<id>${testModel.id}</id>`);
        expect(xmlOutput).toContain('</test>');

        // Check that actual field values are included
        if (testModel.attributes.title) {
          expect(xmlOutput).toContain('<title>');
        }
        if (testModel.attributes.state) {
          expect(xmlOutput).toContain('<state>');
        }
      } else {
        console.log('[DEBUG] No test data found in API response');
      }
    }, 30000);
  });
});
