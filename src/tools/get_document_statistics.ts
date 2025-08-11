import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerGetDocumentStatistics(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'get_document_statistics',
    'Get real-time statistics for a specific document including current connections and connected IPs',
    {
      id: z.string().describe('ID of the document to get statistics for'),
    },
    async ({ id }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/documents/${id}/statistics`, { headers });

        if (!response.ok) {
          if (response.status === 404) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Document with ID ${id} not found.`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `Failed to retrieve document statistics. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const statistics = await response.json();

        return {
          content: [
            {
              type: 'text',
              text: `Document Statistics for ${id}: ${JSON.stringify(statistics, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving document statistics: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
