import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerEncryptDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'encrypt_document',
    'Encrypt a collaborative document using Base64 encryption',
    {
      id: z.string().describe('ID of the document to encrypt'),
      content: z.object({}).describe('Document content in Tiptap JSON format to encrypt'),
    },
    async ({ id, content }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(`${getBaseUrl()}/api/documents/${id}/encrypt`, {
          method: 'POST',
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
          return {
            content: [
              {
                type: 'text',
                text: `Failed to encrypt document. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Document with ID ${id} encrypted successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error encrypting document: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
