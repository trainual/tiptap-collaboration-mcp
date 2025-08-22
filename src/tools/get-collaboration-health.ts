import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export default function registerGetCollaborationHealth(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'get-collaboration-health',
    'Check Tiptap collaboration service health status',
    {},
    async () => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };
        const token = getToken();
        if (token) headers.Authorization = token;

        const response = await fetch(`${getBaseUrl()}/health`, { headers });
        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Health check HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Health check response: ${await response.text()}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error connecting to Tiptap collaboration service: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
