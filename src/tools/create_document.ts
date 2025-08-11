import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerCreateDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'create_document',
    'Create a new collaborative document',
    {
      name: z.string().describe('Name of the document'),
      content: z
        .string()
        .optional()
        .describe('Initial content for the document'),
    },
    async ({ name, content = '' }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, content }),
        });

        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create document. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const documentData = await response.json();

        return {
          content: [
            {
              type: 'text',
              text: `Document created successfully: ${JSON.stringify(
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
              text: `Error creating document: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
