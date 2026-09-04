import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';
import {
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

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
        const response = await collabFetch(getBaseUrl(), '/api/statistics', {
          headers: buildHeaders(getToken()),
        });
        const statistics = await readJson(response);
        return mcpSuccess(
          `Server Statistics: ${JSON.stringify(statistics, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          formatToolError('Error retrieving server statistics', error)
        );
      }
    }
  );
}
