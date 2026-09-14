import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';
import {
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

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
        const response = await collabFetch(getBaseUrl(), '/api/documents', {
          headers: buildHeaders(getToken()),
        });
        const documentsData = await readJson(response);
        return mcpSuccess(
          `Documents: ${JSON.stringify(documentsData, null, 2)}`
        );
      } catch (error) {
        return mcpError(formatToolError('Error listing documents', error));
      }
    }
  );
}
