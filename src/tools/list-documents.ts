import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

export default function registerListDocuments(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'list-documents',
    'List all collaboration documents',
    {},
    async () => {
      try {
        const headers = buildHeaders(getToken());

        const response = await fetch(`${getBaseUrl()}/api/documents`, {
          headers,
        });

        if (!response.ok) {
          return mcpError(
            `Failed to retrieve documents list. HTTP error: ${response.status} ${response.statusText}`
          );
        }

        const documentsData = await response.json();

        return mcpSuccess(
          `Documents: ${JSON.stringify(documentsData, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          `Error listing documents: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
