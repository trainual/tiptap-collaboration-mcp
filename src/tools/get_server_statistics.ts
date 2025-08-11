import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export default function registerGetServerStatistics(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'get_server_statistics',
    'Get server-wide statistics including total documents, connections, and usage metrics',
    {},
    async () => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/statistics`, { headers });

        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to retrieve server statistics. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const statistics = await response.json();

        return {
          content: [
            {
              type: 'text',
              text: `Server Statistics: ${JSON.stringify(statistics, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving server statistics: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
