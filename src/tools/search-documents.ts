import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

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
      limit: z.number().optional().describe('Maximum number of results to return (default: 10)'),
    },
    async ({ query, limit = 10 }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/search`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, limit }),
        });

        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Search failed. HTTP error: ${response.status} ${response.statusText}. Note: Semantic search requires Tiptap Semantic Search to be enabled.`,
              },
            ],
          };
        }

        const searchResults = await response.json();

        return {
          content: [
            {
              type: 'text',
              text: `Search results for "${query}": ${JSON.stringify(
                searchResults,
                null,
                2
              )}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching documents: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
