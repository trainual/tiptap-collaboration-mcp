import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildHeaders,
  buildJsonHeaders,
  mcpError,
  mcpSuccess,
} from '../utils/mcp-helpers.js';
import {
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

export default function registerDuplicateDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'duplicate-document',
    'Duplicate a collaborative document',
    {
      sourceId: z.string().describe('ID of the source document to duplicate'),
      targetId: z.string().describe('ID for the new duplicated document'),
    },
    async ({ sourceId, targetId }) => {
      try {
        const getResponse = await collabFetch(
          getBaseUrl(),
          `/api/documents/${encodeURIComponent(sourceId)}`,
          { headers: buildHeaders(getToken()), query: { format: 'json' } }
        );
        const sourceContent = await readJson(getResponse);

        await collabFetch(
          getBaseUrl(),
          `/api/documents/${encodeURIComponent(targetId)}`,
          {
            method: 'POST',
            headers: buildJsonHeaders(getToken()),
            body: JSON.stringify(sourceContent),
            query: { format: 'json' },
          }
        );

        return mcpSuccess(
          `Document ${sourceId} successfully duplicated to ${targetId}.`
        );
      } catch (error) {
        // 404 can only come from the GET (POST creates), 409 only from the POST.
        return mcpError(
          formatToolError('Error duplicating document', error, {
            404: `Source document with ID ${sourceId} not found.`,
            409: `Target document with ID ${targetId} already exists. Choose a different ID or delete the existing document first.`,
          })
        );
      }
    }
  );
}
