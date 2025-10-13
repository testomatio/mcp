import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

describe('MCP Server E2E Tests', () => {
  let client;
  let transport;
  const apiToken = process.env.TESTOMATIO_API_TOKEN;
  const projectId = process.env.TESTOMATIO_PROJECT_ID;
  const baseUrl = process.env.TESTOMATIO_BASE_URL || 'https://app.testomat.io';

  beforeAll(async () => {
    if (!apiToken || !projectId) {
      console.warn('⚠️  Skipping E2E tests - missing credentials');
      return;
    }

    const indexPath = join(__dirname, '../../index.js');

    transport = new StdioClientTransport({
      command: 'node',
      args: [indexPath, '--token', apiToken, '--project', projectId, '--base-url', baseUrl]
    });

    client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);
  }, 30000);

  afterAll(async () => {
    if (client) await client.close();
  });

  test('should start server and list tools', async () => {
    if (!apiToken) return;

    const result = await client.listTools();
    const toolNames = result.tools.map(t => t.name);

    expect(toolNames).toContain('get_tests');
    expect(toolNames).toContain('search_tests');
    expect(toolNames).toContain('create_test');
    expect(toolNames).toContain('create_suite');
  }, 30000);

  test('should call a tool successfully', async () => {
    if (!apiToken) return;

    const result = await client.callTool({ name: 'get_root_suites', arguments: {} });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Root suites for project');
  }, 30000);

  test('should fail without token', async () => {
    const indexPath = join(__dirname, '../../index.js');
    const proc = spawn('node', [indexPath, '--project', 'test'], { stdio: 'pipe' });

    let stderr = '';
    proc.stderr.on('data', (data) => stderr += data);

    await new Promise((resolve) => {
      proc.on('exit', (code) => {
        expect(code).toBe(1);
        expect(stderr).toContain('API token is required');
        resolve();
      });
    });
  }, 10000);

  test('should fail without project', async () => {
    const indexPath = join(__dirname, '../../index.js');
    const proc = spawn('node', [indexPath, '--token', 'fake'], { stdio: 'pipe' });

    let stderr = '';
    proc.stderr.on('data', (data) => stderr += data);

    await new Promise((resolve) => {
      proc.on('exit', (code) => {
        expect(code).toBe(1);
        expect(stderr).toContain('Project ID is required');
        resolve();
      });
    });
  }, 10000);
});
