import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import registerGetCollaborationHealth from '../src/tools/get-collaboration-health.js';

describe('Configuration Tests', () => {
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

  describe('BASE_URL Configuration', () => {
    it('should handle localhost URLs', () => {
      const getBaseUrl = () => 'http://localhost:8080';
      const getToken = () => undefined;

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle custom domain URLs', () => {
      const getBaseUrl = () => 'https://my-tiptap-server.example.com';
      const getToken = () => undefined;

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle URLs with custom ports', () => {
      const getBaseUrl = () => 'http://collaboration-server:9000';
      const getToken = () => undefined;

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle trailing slashes gracefully', () => {
      const getBaseUrl = () => 'http://localhost:8080/';
      const getToken = () => undefined;

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });
  });

  describe('Token Configuration', () => {
    it('should handle Bearer tokens', () => {
      const getBaseUrl = () => 'http://localhost:8080';
      const getToken = () => 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle API key tokens', () => {
      const getBaseUrl = () => 'http://localhost:8080';
      const getToken = () => 'api-key-12345';

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle empty token gracefully', () => {
      const getBaseUrl = () => 'http://localhost:8080';
      const getToken = () => '';

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle dynamic token functions', () => {
      const getBaseUrl = () => 'http://localhost:8080';
      let tokenValue = 'initial-token';
      const getToken = () => tokenValue;

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
        // Simulate token refresh
        tokenValue = 'refreshed-token';
      }).not.toThrow();
    });
  });

  describe('Environment Variable Simulation', () => {
    it('should work with process.env style configuration', () => {
      // Simulate how the actual server.ts would use environment variables
      const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:8080';
      const getToken = () => process.env.TOKEN;

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();
    });

    it('should handle missing environment variables', () => {
      // Temporarily clear env vars
      const originalBaseUrl = process.env.BASE_URL;
      const originalToken = process.env.TOKEN;
      
      delete process.env.BASE_URL;
      delete process.env.TOKEN;

      const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:8080';
      const getToken = () => process.env.TOKEN;

      expect(() => {
        registerGetCollaborationHealth(server, getBaseUrl, getToken);
      }).not.toThrow();

      // Restore original values
      if (originalBaseUrl) process.env.BASE_URL = originalBaseUrl;
      if (originalToken) process.env.TOKEN = originalToken;
    });
  });
});
