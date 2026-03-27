import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

export default function registerDeleteDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'delete-document',
    'Delete a collaborative document',
    {
      id: z.string().describe('ID of the document to delete'),
    },
    async ({ id }) => {
      try {
        const headers = buildHeaders(getToken());

        const response = await fetch(
          `${getBaseUrl()}/api/documents/${id}`,
          {
            method: 'DELETE',
            headers,
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return mcpError(`Document with ID ${id} not found.`);
          }
          return mcpError(
            `Failed to delete document. HTTP error: ${response.status} ${response.statusText}`
          );
        }

        return mcpSuccess(`Document with ID ${id} deleted successfully.`);
      } catch (error) {
        return mcpError(
          `Error deleting document: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
