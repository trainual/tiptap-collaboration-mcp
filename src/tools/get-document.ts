import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';
import {
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

export default function registerGetDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'get-document',
    'Get information about a collaborative document',
    {
      id: z.string().describe('ID of the document to retrieve'),
    },
    async ({ id }) => {
      try {
        const response = await collabFetch(
          getBaseUrl(),
          `/api/documents/${encodeURIComponent(id)}`,
          { headers: buildHeaders(getToken()), query: { format: 'json' } }
        );
        const documentData = await readJson(response);
        return mcpSuccess(
          `Document Information: ${JSON.stringify(documentData, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          formatToolError('Error retrieving document', error, {
            404: `Document with ID ${id} not found.`,
          })
        );
      }
    }
  );
}
