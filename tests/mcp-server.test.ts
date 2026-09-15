import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectTestClient, type TestMcpClient } from './helpers/mcp-client.js';
import { packageVersion } from '../src/utils/package-info.js';

const EXPECTED_TOOLS = [
  'create-document',
  'delete-document',
  'duplicate-document',
  'export-markdown',
  'get-document',
  'get-document-statistics',
  'get-server-statistics',
  'import-markdown',
  'list-documents',
  'search-documents',
  'update-document',
];

describe('MCP server', () => {
  let mcp: TestMcpClient;

  beforeAll(async () => {
    mcp = await connectTestClient({ baseUrl: 'http://collab.test:8080' });
  });
  afterAll(async () => {
    await mcp.close();
  });

  it('reports the package.json version', () => {
    expect(mcp.client.getServerVersion()).toMatchObject({
      name: 'tiptap-collaboration-mcp',
      version: packageVersion,
    });
  });

  it('registers exactly the expected tools', async () => {
    const { tools } = await mcp.client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(EXPECTED_TOOLS);
  });

  it('exposes the expected input schemas', async () => {
    const { tools } = await mcp.client.listTools();
    const properties = (name: string) => {
      const tool = tools.find((candidate) => candidate.name === name);
      return Object.keys(tool?.inputSchema.properties ?? {}).sort();
    };

    expect(properties('create-document')).toEqual(['content', 'name']);
    expect(properties('get-document')).toEqual(['id']);
    expect(properties('update-document')).toEqual(['content', 'id', 'mode']);
    expect(properties('duplicate-document')).toEqual(['sourceId', 'targetId']);
    expect(properties('search-documents')).toEqual(['limit', 'query']);
    expect(properties('import-markdown')).toEqual([
      'appId',
      'content',
      'format',
    ]);
    expect(properties('list-documents')).toEqual([]);
  });
});
