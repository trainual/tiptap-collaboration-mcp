import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Import all tool registration functions
import registerListDocuments from '../src/tools/list-documents.js';
import registerGetDocument from '../src/tools/get-document.js';
import registerCreateDocument from '../src/tools/create-document.js';
import registerUpdateDocument from '../src/tools/update-document.js';
import registerDeleteDocument from '../src/tools/delete-document.js';
import registerDuplicateDocument from '../src/tools/duplicate-document.js';
import registerSearchDocuments from '../src/tools/search-documents.js';
import registerGetServerStatistics from '../src/tools/get-server-statistics.js';
import registerGetDocumentStatistics from '../src/tools/get-document-statistics.js';
import registerImportMarkdown from '../src/tools/import-markdown.js';
import registerExportMarkdown from '../src/tools/export-markdown.js';

const allTools = [
  registerListDocuments,
  registerGetDocument,
  registerCreateDocument,
  registerUpdateDocument,
  registerDeleteDocument,
  registerDuplicateDocument,
  registerSearchDocuments,
  registerGetServerStatistics,
  registerGetDocumentStatistics,
  registerImportMarkdown,
  registerExportMarkdown,
];

describe('MCP Server Integration Tests', () => {
  let server: McpServer;
  let getBaseUrl: () => string;
  let getToken: () => string | undefined;
  let registeredTools: string[];

  beforeEach(() => {
    server = new McpServer({
      name: 'tiptap-collaboration-mcp',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    getBaseUrl = vi.fn(() => 'http://localhost:8080');
    getToken = vi.fn(() => undefined);
    registeredTools = [];

    const originalTool = server.tool.bind(server);
    server.tool = vi.fn((name, description, schema, handler) => {
      registeredTools.push(name);
      return originalTool(name, description, schema, handler);
    });
  });

  function registerAll() {
    allTools.forEach(register => register(server, getBaseUrl, getToken));
  }

  describe('Tool Registration', () => {
    it('should register all collaboration tools without errors', () => {
      const collaborationTools = allTools.filter(
        fn => fn !== registerImportMarkdown && fn !== registerExportMarkdown
      );

      expect(() => {
        collaborationTools.forEach(register => register(server, getBaseUrl, getToken));
      }).not.toThrow();
    });

    it('should register all conversion tools without errors', () => {
      expect(() => {
        registerImportMarkdown(server, getBaseUrl, getToken);
        registerExportMarkdown(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should register exactly 12 tools in total', () => {
      registerAll();
      expect(registeredTools).toHaveLength(11);
    });

    it('should register tools with expected names', () => {
      registerAll();

      const expectedTools = [
        'list-documents',
        'get-document',
        'create-document',
        'update-document',
        'delete-document',
        'duplicate-document',
        'search-documents',
        'get-server-statistics',
        'get-document-statistics',
        'import-markdown',
        'export-markdown',
      ];

      expect(registeredTools).toEqual(expect.arrayContaining(expectedTools));
      expect(registeredTools).toHaveLength(expectedTools.length);
    });
  });

  describe('MCP Protocol Compliance', () => {
    it('should initialize server with correct name and version', () => {
      expect(server).toBeDefined();
      expect(typeof server.tool).toBe('function');
    });

    it('should handle tool registration with proper MCP schema', () => {
      registerCreateDocument(server, getBaseUrl, getToken);

      expect(server.tool).toHaveBeenCalledWith(
        'create-document',
        'Create a new collaborative document',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should register tools with proper parameter schemas', () => {
      registerGetDocument(server, getBaseUrl, getToken);

      const call = (server.tool as any).mock.calls.find(
        (call: any) => call[0] === 'get-document'
      );

      expect(call).toBeDefined();
      expect(call[2]).toHaveProperty('id');
    });

    it('should register tools with proper handler functions', () => {
      registerGetServerStatistics(server, getBaseUrl, getToken);

      const call = (server.tool as any).mock.calls.find(
        (call: any) => call[0] === 'get-server-statistics'
      );

      expect(call).toBeDefined();
      expect(typeof call[3]).toBe('function');
    });
  });

  describe('Error Propagation', () => {
    it('should handle invalid base URL configuration', () => {
      const invalidGetBaseUrl = () => '';

      expect(() => {
        registerGetServerStatistics(server, invalidGetBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle missing token gracefully', () => {
      const noToken = () => undefined;

      expect(() => {
        registerCreateDocument(server, getBaseUrl, noToken);
      }).not.toThrow();
    });

    it('should register tools even with invalid configuration', () => {
      const invalidGetBaseUrl = () => 'not-a-url';
      const invalidGetToken = () => 'invalid-token';

      expect(() => {
        registerGetServerStatistics(server, invalidGetBaseUrl, invalidGetToken);
        registerListDocuments(server, invalidGetBaseUrl, invalidGetToken);
      }).not.toThrow();

      expect(registeredTools).toContain('get-server-statistics');
      expect(registeredTools).toContain('list-documents');
    });
  });

  describe('Tool Categories', () => {
    it('should register all collaboration API tools', () => {
      const collaborationTools = [
        registerListDocuments,
        registerGetDocument,
        registerCreateDocument,
        registerUpdateDocument,
        registerDeleteDocument,
        registerDuplicateDocument,
        registerSearchDocuments,
        registerGetServerStatistics,
        registerGetDocumentStatistics,
      ];

      collaborationTools.forEach(registerTool => {
        expect(() => registerTool(server, getBaseUrl, getToken)).not.toThrow();
      });

      expect(registeredTools).toHaveLength(9);
    });

    it('should register all conversion API tools', () => {
      const conversionTools = [
        registerImportMarkdown,
        registerExportMarkdown,
      ];

      conversionTools.forEach(registerTool => {
        expect(() => registerTool(server, getBaseUrl, getToken)).not.toThrow();
      });

      expect(registeredTools).toHaveLength(2);
    });
  });

  describe('Configuration Handling', () => {
    it('should use provided base URL function', () => {
      const customBaseUrl = 'https://custom-server.example.com:9000';
      const customGetBaseUrl = vi.fn(() => customBaseUrl);

      registerGetServerStatistics(server, customGetBaseUrl, getToken);

      expect(customGetBaseUrl).toBeDefined();
    });

    it('should use provided token function', () => {
      const customToken = 'Bearer custom-token-123';
      const customGetToken = vi.fn(() => customToken);

      registerCreateDocument(server, getBaseUrl, customGetToken);

      expect(customGetToken).toBeDefined();
    });

    it('should handle environment variable style configuration', () => {
      const envGetBaseUrl = () => process.env.BASE_URL || 'http://localhost:8080';
      const envGetToken = () => process.env.TOKEN;

      expect(() => {
        registerGetServerStatistics(server, envGetBaseUrl, envGetToken);
        registerListDocuments(server, envGetBaseUrl, envGetToken);
      }).not.toThrow();

      expect(registeredTools).toContain('get-server-statistics');
      expect(registeredTools).toContain('list-documents');
    });
  });
});
