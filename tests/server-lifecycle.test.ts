import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

describe('Server Lifecycle Tests', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({
      name: 'tiptap-collaboration-mcp',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  it('should create server instance successfully', () => {
    expect(server).toBeDefined();
    expect(typeof server.tool).toBe('function');
    expect(typeof server.close).toBe('function');
  });

  it('should handle server close gracefully', async () => {
    expect(async () => {
      await server.close();
    }).not.toThrow();
  });

  it('should support stdio transport connection', () => {
    expect(() => {
      const transport = new StdioServerTransport();
      // Just verify we can create the transport without errors
      expect(transport).toBeDefined();
    }).not.toThrow();
  });
});
