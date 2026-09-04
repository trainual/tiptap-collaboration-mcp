import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildJsonHeaders,
  mcpError,
  mcpSuccess,
} from '../utils/mcp-helpers.js';
import {
  CollabBodyError,
  collabFetch,
  formatToolError,
  readJson,
} from '../utils/collab-request.js';

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
          content: [{ type: 'paragraph' }],
        })
        .describe(
          'Document content in Tiptap JSON format (uses default if not provided)'
        ),
    },
    async ({ name, content }) => {
      try {
        const response = await collabFetch(
          getBaseUrl(),
          `/api/documents/${encodeURIComponent(name)}`,
          {
            method: 'POST',
            headers: buildJsonHeaders(getToken()),
            body: JSON.stringify(content),
            query: { format: 'json' },
          }
        );

        try {
          const documentData = await readJson(response);
          return mcpSuccess(
            `Document created successfully: ${JSON.stringify(documentData, null, 2)}`
          );
        } catch (error) {
          // The server normally answers 204 with no body.
          if (error instanceof CollabBodyError) {
            return mcpSuccess(`Document '${name}' created successfully.`);
          }
          throw error;
        }
      } catch (error) {
        return mcpError(
          formatToolError('Error creating document', error, {
            409: `Document with name ${name} already exists. Choose a different name or delete the existing document first.`,
          })
        );
      }
    }
  );
}
