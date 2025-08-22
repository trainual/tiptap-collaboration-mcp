import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

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
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/documents/${id}`, {
          method: 'DELETE',
          headers,
        });

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
                text: `Failed to delete document. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Document with ID ${id} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting document: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
