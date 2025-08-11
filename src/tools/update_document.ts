import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerUpdateDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'update_document',
    'Update a collaborative document with new content',
    {
      id: z.string().describe('ID of the document to update'),
      content: z.object({}).describe('Document content in Tiptap JSON format'),
      mode: z.enum(['replace', 'append']).optional().describe('Update mode: replace entire document or append content (default: replace)'),
    },
    async ({ id, content, mode = 'replace' }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/documents/${id}?mode=${mode}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(content),
        });

        if (!response.ok) {
          if (response.status === 404) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Document with ID ${id} not found.`,
                },
              ],
            };
          }
          if (response.status === 422) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Invalid payload or update cannot be applied to document ${id}.`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update document. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Document with ID ${id} updated successfully using ${mode} mode.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error updating document: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
