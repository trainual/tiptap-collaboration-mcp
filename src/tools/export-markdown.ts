import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildJsonHeaders,
  mcpError,
  mcpSuccess,
} from '../utils/mcp-helpers.js';
import { collabFetch, formatToolError } from '../utils/collab-request.js';

const MISSING_TOKEN_MESSAGE =
  'export-markdown requires CONVERT_TOKEN (a Tiptap Cloud Convert JWT). ' +
  'Start the server with CONVERT_TOKEN <jwt> (and optionally CONVERT_URL <url>); see the README.';

export default function registerExportMarkdown(
  server: McpServer,
  getConvertUrl: () => string,
  getConvertToken: () => string | undefined
) {
  server.tool(
    'export-markdown',
    'Export Tiptap JSON content to Markdown format via the Tiptap Conversion service',
    {
      content: z
        .object({})
        .passthrough()
        .describe('Tiptap JSON content to convert to Markdown'),
      format: z
        .enum(['md', 'gfm'])
        .optional()
        .describe(
          'Accepted for backwards compatibility; the v2 Conversion API has no format switch'
        ),
      appId: z
        .string()
        .optional()
        .describe('Tiptap Convert App ID (optional on the v2 API)'),
    },
    async ({ content, appId }) => {
      const convertToken = getConvertToken();
      if (!convertToken) return mcpError(MISSING_TOKEN_MESSAGE);

      try {
        const response = await collabFetch(
          getConvertUrl(),
          '/v2/convert/export/markdown',
          {
            method: 'POST',
            headers: buildJsonHeaders(
              `Bearer ${convertToken}`,
              appId ? { 'X-App-Id': appId } : undefined
            ),
            // The v2 API expects the Tiptap JSON document serialized as a string.
            body: JSON.stringify({ doc: JSON.stringify(content) }),
          }
        );
        const markdownContent = await response.text();
        return mcpSuccess(
          `Tiptap JSON exported to Markdown successfully:\n\n${markdownContent}`
        );
      } catch (error) {
        return mcpError(
          formatToolError('Error exporting to markdown', error, {
            401: 'Conversion service rejected the credentials - CONVERT_TOKEN must be a valid Tiptap Cloud Convert JWT.',
          })
        );
      }
    }
  );
}
