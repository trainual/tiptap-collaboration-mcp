import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerBatchImportDocuments(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'batch-import-documents',
    'Bulk import multiple documents using predefined JSON structure',
    {
      documents: z.array(z.array(z.object({
        created_at: z.string().describe('Creation timestamp in ISO format'),
        version: z.number().describe('Document version number'),
        name: z.string().describe('Document name/identifier'),
        tiptap_json: z.object({}).describe('Document content in Tiptap JSON format'),
      }))).describe('Array of document arrays, where each inner array represents versions of a single document'),
    },
    async ({ documents }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/admin/batch-import`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(documents),
        });

        if (!response.ok) {
          if (response.status === 400) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Invalid data provided for batch import. Please check the document structure and format.',
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `Failed to import documents. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Successfully imported ${documents.length} document groups with their versions.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error importing documents: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
