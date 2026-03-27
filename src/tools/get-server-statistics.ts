import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

export default function registerGetServerStatistics(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'get-server-statistics',
    'Get server-wide statistics including total documents, connections, and usage metrics',
    {},
    async () => {
      try {
        const headers = buildHeaders(getToken());

        const response = await fetch(`${getBaseUrl()}/api/statistics`, {
          headers,
        });

        if (!response.ok) {
          return mcpError(
            `Failed to retrieve server statistics. HTTP error: ${response.status} ${response.statusText}`
          );
        }

        const statistics = await response.json();

        return mcpSuccess(
          `Server Statistics: ${JSON.stringify(statistics, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          `Error retrieving server statistics: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
