import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerExportMarkdown(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'export_markdown',
    'Convert Tiptap JSON content to Markdown format using the Tiptap Conversion API',
    {
      content: z.object({}).describe('Tiptap JSON content to convert to Markdown'),
      format: z.enum(['md', 'gfm']).optional().describe('Output format: md (standard) or gfm (GitHub Flavored Markdown). Default: md'),
      appId: z.string().describe('Your Tiptap App ID for the conversion service'),
    },
    async ({ content, format = 'md', appId }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
          'X-App-Id': appId,
        };

        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${getBaseUrl()}/api/convert/export`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content, format }),
        });

        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to export to markdown. HTTP error: ${response.status} ${response.statusText}. Make sure you have a valid JWT token and App ID for the Tiptap Conversion service.`,
              },
            ],
          };
        }

        const markdownContent = await response.text();

        return {
          content: [
            {
              type: 'text',
              text: `Tiptap JSON exported to ${format.toUpperCase()} successfully:\n\n${markdownContent}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error exporting to markdown: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
