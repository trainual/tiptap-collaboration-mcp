import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerCreateDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'create-document',
    'Create a new collaborative document',
    {
      name: z.string().describe('name of the new document'),
      content: z
        .object({})
        .passthrough()
        .default({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: {
                indent: 0,
                textAlign: 'left',
              },
              content: [
                {
                  text: 'Test',
                  type: 'text',
                },
              ],
            },
          ],
        })
        .describe(
          'Document content in Tiptap JSON format (uses default if not provided)'
        ),
    },
    async ({ name, content }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        const response = await fetch(
          `${getBaseUrl()}/api/documents/${name}?format=json`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(content),
          }
        );

        if (!response.ok) {
          if (response.status === 409) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Document with name ${name} already exists. Choose a different name or delete the existing document first.`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create document. HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        // Handle successful response - 204 No Content means success with empty body
        if (response.status === 204) {
          return {
            content: [
              {
                type: 'text',
                text: `Document '${name}' created successfully.`,
              },
            ],
          };
        }

        // For other success status codes, try to parse JSON response
        try {
          const documentData = await response.json();
          return {
            content: [
              {
                type: 'text',
                text: `Document created successfully: ${JSON.stringify(
                  documentData,
                  null,
                  2
                )}`,
              },
            ],
          };
        } catch (parseError) {
          // If JSON parsing fails, just return success message
          return {
            content: [
              {
                type: 'text',
                text: `Document '${name}' created successfully (no response data).`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating document: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
