import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildJsonHeaders,
  mcpError,
  mcpSuccess,
} from '../utils/mcp-helpers.js';

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
        const headers = buildJsonHeaders(getToken());

        const response = await fetch(
          `${getBaseUrl()}/api/documents/${encodeURIComponent(name)}?format=json`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(content),
          }
        );

        if (!response.ok) {
          if (response.status === 409) {
            return mcpError(
              `Document with name ${name} already exists. Choose a different name or delete the existing document first.`
            );
          }
          return mcpError(
            `Failed to create document. HTTP error: ${response.status} ${response.statusText}`
          );
        }

        if (response.status === 204) {
          return mcpSuccess(`Document '${name}' created successfully.`);
        }

        try {
          const documentData = await response.json();
          return mcpSuccess(
            `Document created successfully: ${JSON.stringify(documentData, null, 2)}`
          );
        } catch {
          return mcpSuccess(
            `Document '${name}' created successfully (no response data).`
          );
        }
      } catch (error) {
        return mcpError(
          `Error creating document: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
