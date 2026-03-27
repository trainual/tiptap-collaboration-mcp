import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

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
        const headers = buildHeaders(getToken());

        const response = await fetch(`${getBaseUrl()}/health`, { headers });
        if (!response.ok) {
          return mcpError(
            `Health check HTTP error: ${response.status} ${response.statusText}`
          );
        }

        return mcpSuccess(`Health check response: ${await response.text()}`);
      } catch (error) {
        return mcpError(
          `Error connecting to Tiptap collaboration service: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
