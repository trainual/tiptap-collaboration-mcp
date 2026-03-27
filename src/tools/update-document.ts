import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildJsonHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

export default function registerUpdateDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'update-document',
    'Update a collaborative document with new content',
    {
      id: z.string().describe('ID of the document to update'),
      content: z
        .object({})
        .describe('Document content in Tiptap JSON format'),
      mode: z
        .enum(['replace', 'append'])
        .optional()
        .describe(
          'Update mode: replace entire document or append content (default: replace)'
        ),
    },
    async ({ id, content, mode = 'replace' }) => {
      try {
        const headers = buildJsonHeaders(getToken());

        const response = await fetch(
          `${getBaseUrl()}/api/documents/${id}?format=json&mode=${mode}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(content),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return mcpError(`Document with ID ${id} not found.`);
          }
          if (response.status === 422) {
            return mcpError(
              `Invalid payload or update cannot be applied to document ${id}.`
            );
          }
          return mcpError(
            `Failed to update document. HTTP error: ${response.status} ${response.statusText}`
          );
        }

        return mcpSuccess(
          `Document with ID ${id} updated successfully using ${mode} mode.`
        );
      } catch (error) {
        return mcpError(
          `Error updating document: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
