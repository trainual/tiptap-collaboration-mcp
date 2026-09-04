import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';
import {
  CollabHttpError,
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

export default function registerGetDocumentStatistics(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'get-document-statistics',
    'Get real-time statistics for a specific document including current connections and connected IPs',
    {
      id: z.string().describe('ID of the document to get statistics for'),
    },
    async ({ id }) => {
      try {
        const headers = buildHeaders(getToken());
        // The statistics endpoint returns 200 with zeroes for nonexistent
        // documents, so check existence first. HEAD exists since server
        // 3.91.0; older servers answer 501 - skip the check there and keep
        // the old zeroes-for-missing behavior.
        try {
          await collabFetch(
            getBaseUrl(),
            `/api/documents/${encodeURIComponent(id)}`,
            { method: 'HEAD', headers }
          );
        } catch (error) {
          if (!(error instanceof CollabHttpError) || error.status !== 501) {
            throw error;
          }
        }

        const response = await collabFetch(
          getBaseUrl(),
          `/api/documents/${encodeURIComponent(id)}/statistics`,
          { headers }
        );
        const statistics = await readJson(response);
        return mcpSuccess(
          `Document Statistics for ${id}: ${JSON.stringify(statistics, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          formatToolError('Error retrieving document statistics', error, {
            404: `Document with ID ${id} not found.`,
          })
        );
      }
    }
  );
}
