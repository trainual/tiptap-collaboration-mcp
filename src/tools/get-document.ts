import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

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
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };
        
        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/documents/${id}`, { headers });
        
        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Document with ID ${id} not found. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const documentData = await response.json();

        return {
          content: [
            {
              type: 'text',
              text: `Document Information: ${JSON.stringify(
                documentData,
                null,
                2
              )}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving document: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
