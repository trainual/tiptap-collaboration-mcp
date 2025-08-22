import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerImportMarkdown(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'import-markdown',
    'Import Markdown content and convert to Tiptap JSON format',
    {
      content: z.string().describe('Markdown content to convert to Tiptap JSON'),
      format: z.enum(['md', 'gfm']).optional().describe('Markdown format: md (standard) or gfm (GitHub Flavored Markdown). Default: md'),
      appId: z.string().describe('Your Tiptap App ID for the conversion service'),
    },
    async ({ content, format = 'md', appId }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'X-App-Id': appId,
        };

        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Create form data for file upload
        const formData = new FormData();
        const blob = new Blob([content], { type: 'text/markdown' });
        formData.append('file', blob, 'content.md');

        const response = await fetch(`${getBaseUrl()}/api/convert/import?format=${format}`, {
          method: 'POST',
          headers: {
            'User-Agent': 'tiptap-collaboration-mcp',
            'X-App-Id': appId,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to import markdown. HTTP error: ${response.status} ${response.statusText}. Make sure you have a valid JWT token and App ID for the Tiptap Conversion service.`,
              },
            ],
          };
        }

        const tiptapJson = await response.json();

        return {
          content: [
            {
              type: 'text',
              text: `Markdown imported successfully: ${JSON.stringify(tiptapJson, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error importing markdown: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
