import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';
import { collabFetch, formatToolError } from '../utils/collab-request.js';

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
        await collabFetch(
          getBaseUrl(),
          `/api/documents/${encodeURIComponent(id)}`,
          { method: 'DELETE', headers: buildHeaders(getToken()) }
        );
        return mcpSuccess(`Document with ID ${id} deleted successfully.`);
      } catch (error) {
        return mcpError(
          formatToolError('Error deleting document', error, {
            404: `Document with ID ${id} not found.`,
          })
        );
      }
    }
  );
}
