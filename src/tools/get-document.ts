import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

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
        const headers = buildHeaders(getToken());

        const response = await fetch(
          `${getBaseUrl()}/api/documents/${encodeURIComponent(id)}`,
          { headers }
        );

        if (!response.ok) {
          return mcpError(
            `Document with ID ${id} not found. HTTP error: ${response.status} ${response.statusText}`
          );
        }

        const documentData = await response.json();

        return mcpSuccess(
          `Document Information: ${JSON.stringify(documentData, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          `Error retrieving document: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
