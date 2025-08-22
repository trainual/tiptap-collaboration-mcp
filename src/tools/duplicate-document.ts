import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export default function registerDuplicateDocument(
  server: McpServer,
  getBaseUrl: () => string,
  getToken: () => string | undefined
) {
  server.tool(
    'duplicate-document',
    'Duplicate a collaborative document',
    {
      sourceId: z.string().describe('ID of the source document to duplicate'),
      targetId: z.string().describe('ID for the new duplicated document'),
    },
    async ({ sourceId, targetId }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'tiptap-collaboration-mcp',
          'Content-Type': 'application/json',
        };

        const token = getToken();
        if (token) headers['Authorization'] = token;

        // First, get the source document
        const getResponse = await fetch(`${getBaseUrl()}/api/documents/${sourceId}`, {
          headers,
        });

        if (!getResponse.ok) {
          if (getResponse.status === 404) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Source document with ID ${sourceId} not found.`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `Failed to retrieve source document. HTTP error: ${getResponse.status} ${getResponse.statusText}`,
              },
            ],
          };
        }

        const sourceContent = await getResponse.json();

        // Then, create the new document with the source content
        const createResponse = await fetch(`${getBaseUrl()}/api/documents?format=json`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...sourceContent, id: targetId }),
        });

        if (!createResponse.ok) {
          if (createResponse.status === 409) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Target document with ID ${targetId} already exists. Choose a different ID or delete the existing document first.`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create duplicate document. HTTP error: ${createResponse.status} ${createResponse.statusText}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Document ${sourceId} successfully duplicated to ${targetId}.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error duplicating document: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            },
          ],
        };
      }
    }
  );
}
