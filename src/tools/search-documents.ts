import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildJsonHeaders,
  mcpError,
  mcpSuccess,
} from '../utils/mcp-helpers.js';
import {
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

export default function registerSearchDocuments(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'search-documents',
    'Perform semantic search across documents',
    {
      query: z.string().describe('Search query for semantic document search'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum number of results to return (default: 10)'),
    },
    async ({ query, limit = 10 }) => {
      try {
        // Documented contract: search terms in the body as `content`,
        // `limit` as a query parameter.
        const response = await collabFetch(getBaseUrl(), '/api/search', {
          method: 'POST',
          headers: buildJsonHeaders(getToken()),
          body: JSON.stringify({ content: query }),
          query: { limit },
        });
        const searchResults = await readJson(response);
        return mcpSuccess(
          `Search results for "${query}": ${JSON.stringify(searchResults, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          formatToolError('Error searching documents', error, {
            501: 'Semantic search is not enabled on this server (it is a Tiptap Cloud restricted-beta feature).',
          })
        );
      }
    }
  );
}
