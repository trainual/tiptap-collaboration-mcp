import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHeaders, mcpError, mcpSuccess } from '../utils/mcp-helpers.js';
import {
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

const MISSING_TOKEN_MESSAGE =
  'import-markdown requires CONVERT_TOKEN (a Tiptap Cloud Convert JWT). ' +
  'Start the server with CONVERT_TOKEN <jwt> (and optionally CONVERT_URL <url>); see the README.';

export default function registerImportMarkdown(
  server: McpServer,
  getConvertUrl: () => string,
  getConvertToken: () => string | undefined
) {
  server.tool(
    'import-markdown',
    'Import Markdown content and convert to Tiptap JSON format via the Tiptap Conversion service',
    {
      content: z
        .string()
        .describe('Markdown content to convert to Tiptap JSON'),
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
        const formData = new FormData();
        formData.append(
          'file',
          new Blob([content], { type: 'text/markdown' }),
          'content.md'
        );

        const response = await collabFetch(
          getConvertUrl(),
          '/v2/convert/import/markdown',
          {
            method: 'POST',
            headers: buildHeaders(
              `Bearer ${convertToken}`,
              appId ? { 'X-App-Id': appId } : undefined
            ),
            body: formData,
          }
        );
        const result = await readJson(response);
        return mcpSuccess(
          `Markdown imported successfully: ${JSON.stringify(result, null, 2)}`
        );
      } catch (error) {
        return mcpError(
          formatToolError('Error importing markdown', error, {
            401: 'Conversion service rejected the credentials - CONVERT_TOKEN must be a valid Tiptap Cloud Convert JWT.',
          })
        );
      }
    }
  );
}
