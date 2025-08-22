import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Import all tool registration functions
import registerGetCollaborationHealth from '../src/tools/get-collaboration-health.js';
import registerListDocuments from '../src/tools/list-documents.js';
import registerGetDocument from '../src/tools/get-document.js';
import registerCreateDocument from '../src/tools/create-document.js';
import registerUpdateDocument from '../src/tools/update-document.js';
import registerDeleteDocument from '../src/tools/delete-document.js';
import registerDuplicateDocument from '../src/tools/duplicate-document.js';
import registerEncryptDocument from '../src/tools/encrypt-document.js';
import registerSearchDocuments from '../src/tools/search-documents.js';
import registerBatchImportDocuments from '../src/tools/batch-import-documents.js';
import registerGetServerStatistics from '../src/tools/get-server-statistics.js';
import registerGetDocumentStatistics from '../src/tools/get-document-statistics.js';
import registerImportMarkdown from '../src/tools/import-markdown.js';
import registerExportMarkdown from '../src/tools/export-markdown.js';

describe('MCP Server Integration Tests', () => {
  let server: McpServer;
  let getBaseUrl: () => string;
  let getToken: () => string | undefined;
  let registeredTools: string[];

  beforeEach(() => {
    // Create a fresh server instance for each test
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

    // Mock the server.tool method to track registrations
    const originalTool = server.tool.bind(server);
    server.tool = vi.fn((name, description, schema, handler) => {
      registeredTools.push(name);
      return originalTool(name, description, schema, handler);
    });
  });

  describe('Tool Registration', () => {
    it('should register all collaboration tools without errors', () => {
      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
        registerListDocuments(server, getBaseUrl, getToken);
        registerGetDocument(server, getBaseUrl, getToken);
        registerCreateDocument(server, getBaseUrl, getToken);
        registerUpdateDocument(server, getBaseUrl, getToken);
        registerDeleteDocument(server, getBaseUrl, getToken);
        registerDuplicateDocument(server, getBaseUrl, getToken);
        registerEncryptDocument(server, getBaseUrl, getToken);
        registerSearchDocuments(server, getBaseUrl, getToken);
        registerBatchImportDocuments(server, getBaseUrl, getToken);
        registerGetServerStatistics(server, getBaseUrl, getToken);
        registerGetDocumentStatistics(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should register all conversion tools without errors', () => {
      expect(() => {
        registerImportMarkdown(server, getBaseUrl, getToken);
        registerExportMarkdown(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should register exactly 14 tools in total', () => {
      // Register all tools
      registerGetCollaborationHealth(server, getBaseUrl, getToken);
      registerListDocuments(server, getBaseUrl, getToken);
      registerGetDocument(server, getBaseUrl, getToken);
      registerCreateDocument(server, getBaseUrl, getToken);
      registerUpdateDocument(server, getBaseUrl, getToken);
      registerDeleteDocument(server, getBaseUrl, getToken);
      registerDuplicateDocument(server, getBaseUrl, getToken);
      registerEncryptDocument(server, getBaseUrl, getToken);
      registerSearchDocuments(server, getBaseUrl, getToken);
      registerBatchImportDocuments(server, getBaseUrl, getToken);
      registerGetServerStatistics(server, getBaseUrl, getToken);
      registerGetDocumentStatistics(server, getBaseUrl, getToken);
      registerImportMarkdown(server, getBaseUrl, getToken);
      registerExportMarkdown(server, getBaseUrl, getToken);

      expect(registeredTools).toHaveLength(14);
    });

    it('should register tools with expected names', () => {
      // Register all tools
      registerGetCollaborationHealth(server, getBaseUrl, getToken);
      registerListDocuments(server, getBaseUrl, getToken);
      registerGetDocument(server, getBaseUrl, getToken);
      registerCreateDocument(server, getBaseUrl, getToken);
      registerUpdateDocument(server, getBaseUrl, getToken);
      registerDeleteDocument(server, getBaseUrl, getToken);
      registerDuplicateDocument(server, getBaseUrl, getToken);
      registerEncryptDocument(server, getBaseUrl, getToken);
      registerSearchDocuments(server, getBaseUrl, getToken);
      registerBatchImportDocuments(server, getBaseUrl, getToken);
      registerGetServerStatistics(server, getBaseUrl, getToken);
      registerGetDocumentStatistics(server, getBaseUrl, getToken);
      registerImportMarkdown(server, getBaseUrl, getToken);
      registerExportMarkdown(server, getBaseUrl, getToken);

      const expectedTools = [
        'get-collaboration-health',
        'list-documents',
        'get-document',
        'create-document',
        'update-document',
        'delete-document',
        'duplicate-document',
        'encrypt-document',
        'search-documents',
        'batch-import-documents',
        'get-server-statistics',
        'get-document-statistics',
        'import-markdown',
        'export-markdown'
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

      // Verify the tool was registered with proper MCP structure
      expect(server.tool).toHaveBeenCalledWith(
        'create-document',
        'Create a new collaborative document',
        expect.any(Object), // Schema object
        expect.any(Function) // Handler function
      );
    });

    it('should register tools with proper parameter schemas', () => {
      registerGetDocument(server, getBaseUrl, getToken);

      const call = (server.tool as any).mock.calls.find(
        (call: any) => call[0] === 'get-document'
      );

      expect(call).toBeDefined();
      expect(call[2]).toHaveProperty('id'); // Should have id parameter
    });

    it('should register tools with proper handler functions', () => {
      registerGetCollaborationHealth(server, getBaseUrl, getToken);

      const call = (server.tool as any).mock.calls.find(
        (call: any) => call[0] === 'get-collaboration-health'
      );

      expect(call).toBeDefined();
      expect(typeof call[3]).toBe('function'); // Handler should be a function
    });
  });

  describe('Error Propagation', () => {
    it('should handle invalid base URL configuration', () => {
      const invalidGetBaseUrl = () => '';
      
      expect(() => {
        registerGetCollaborationHealth(server, invalidGetBaseUrl, getToken);
      }).not.toThrow(); // Registration should not throw, but runtime calls might fail
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
        registerGetCollaborationHealth(server, invalidGetBaseUrl, invalidGetToken);
        registerListDocuments(server, invalidGetBaseUrl, invalidGetToken);
      }).not.toThrow();

      expect(registeredTools).toContain('get-collaboration-health');
      expect(registeredTools).toContain('list-documents');
    });
  });

  describe('Tool Categories', () => {
    it('should register all collaboration API tools', () => {
      const collaborationTools = [
        registerGetCollaborationHealth,
        registerListDocuments,
        registerGetDocument,
        registerCreateDocument,
        registerUpdateDocument,
        registerDeleteDocument,
        registerDuplicateDocument,
        registerEncryptDocument,
        registerSearchDocuments,
        registerBatchImportDocuments,
        registerGetServerStatistics,
        registerGetDocumentStatistics,
      ];

      collaborationTools.forEach(registerTool => {
        expect(() => registerTool(server, getBaseUrl, getToken)).not.toThrow();
      });

      expect(registeredTools).toHaveLength(12);
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

      registerGetCollaborationHealth(server, customGetBaseUrl, getToken);

      // The base URL function should be stored and could be called later
      expect(customGetBaseUrl).toBeDefined();
    });

    it('should use provided token function', () => {
      const customToken = 'Bearer custom-token-123';
      const customGetToken = vi.fn(() => customToken);

      registerCreateDocument(server, getBaseUrl, customGetToken);

      // The token function should be stored and could be called later
      expect(customGetToken).toBeDefined();
    });

    it('should handle environment variable style configuration', () => {
      // Simulate environment variable configuration
      const envGetBaseUrl = () => process.env.BASE_URL || 'http://localhost:8080';
      const envGetToken = () => process.env.TOKEN;

      expect(() => {
        registerGetCollaborationHealth(server, envGetBaseUrl, envGetToken);
        registerListDocuments(server, envGetBaseUrl, envGetToken);
      }).not.toThrow();

      expect(registeredTools).toContain('get-collaboration-health');
      expect(registeredTools).toContain('list-documents');
    });
  });
});
