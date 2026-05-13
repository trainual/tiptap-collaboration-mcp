import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

export default function registerGetDocumentStatistics(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'get-document-statistics',
    'Get real-time statistics for a specific document including current connections and connected IPs',
    {
      id: z.string().describe('ID of the document to get statistics for'),
    },
    async ({ id }) => {
      try {
        const headers = buildHeaders(getToken());

        const response = await fetch(
          `${getBaseUrl()}/api/documents/${encodeURIComponent(id)}/statistics`,
          { headers }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return mcpError(`Document with ID ${id} not found.`);
          }
          return mcpError(
            `Failed to retrieve document statistics. HTTP error: ${response.status} ${response.statusText}`
          );
        }

        const statistics = await response.json();

        return mcpSuccess(
          `Document Statistics for ${id}: ${JSON.stringify(statistics, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          `Error retrieving document statistics: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
