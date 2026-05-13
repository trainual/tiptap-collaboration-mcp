import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { mcpError, mcpSuccess } from '../utils/mcp-helpers.js';

export default function registerExportMarkdown(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'export-markdown',
    'Export Tiptap JSON content to Markdown format',
    {
      content: z
        .object({})
        .passthrough()
        .describe('Tiptap JSON content to convert to Markdown'),
      format: z
        .enum(['md', 'gfm'])
        .optional()
        .describe(
          'Output format: md (standard) or gfm (GitHub Flavored Markdown). Default: md'
        ),
      appId: z
        .string()
        .describe('Your Tiptap App ID for the conversion service'),
    },
    async ({ content, format = 'md', appId }) => {
      try {
        // Conversion API uses Bearer token (different from collaboration API which uses raw token)
        const token = getToken();
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
          'X-App-Id': appId,
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${getBaseUrl()}/api/convert/export`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content, format }),
        });

        if (!response.ok) {
          return mcpError(
            `Failed to export to markdown. HTTP error: ${response.status} ${response.statusText}. Make sure you have a valid JWT token and App ID for the Tiptap Conversion service.`
          );
        }

        const markdownContent = await response.text();

        return mcpSuccess(
          `Tiptap JSON exported to ${format.toUpperCase()} successfully:\n\n${markdownContent}`
        );
      } catch (error) {
        return mcpError(
          `Error exporting to markdown: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
