import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export default function registerListDocuments(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'list_documents',
    'List all collaboratiion documents',
    {},
    async () => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/documents`, { headers });

        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to retrieve documents list. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const documentsData = await response.json();

        return {
          content: [
            {
              type: 'text',
              text: `Documents: ${JSON.stringify(documentsData, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error listing documents: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
