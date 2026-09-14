import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildJsonHeaders,
  mcpError,
  mcpSuccess,
} from '../utils/mcp-helpers.js';
import { collabFetch, formatToolError } from '../utils/collab-request.js';

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
        .passthrough()
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
        await collabFetch(
          getBaseUrl(),
          `/api/documents/${encodeURIComponent(id)}`,
          {
            method: 'PATCH',
            headers: buildJsonHeaders(getToken()),
            body: JSON.stringify(content),
            query: { format: 'json', mode },
          }
        );
        return mcpSuccess(
          `Document with ID ${id} updated successfully using ${mode} mode.`
        );
      } catch (error) {
        return mcpError(
          formatToolError('Error updating document', error, {
            404: `Document with ID ${id} not found.`,
            409: `Document ${id} changed concurrently; retry the update.`,
            422: `Invalid payload or update cannot be applied to document ${id}.`,
          })
        );
      }
    }
  );
}
