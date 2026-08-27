import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildHeaders,
  buildJsonHeaders,
  mcpError,
  mcpSuccess,
} from '../utils/mcp-helpers.js';

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
        const getResponse = await fetch(
          `${getBaseUrl()}/api/documents/${encodeURIComponent(sourceId)}`,
          { headers: buildHeaders(getToken()) }
        );

        if (!getResponse.ok) {
          if (getResponse.status === 404) {
            return mcpError(`Source document with ID ${sourceId} not found.`);
          }
          return mcpError(
            `Failed to retrieve source document. HTTP error: ${getResponse.status} ${getResponse.statusText}`
          );
        }

        const sourceContent = await getResponse.json();

        const createResponse = await fetch(
          `${getBaseUrl()}/api/documents/${encodeURIComponent(targetId)}?format=json`,
          {
            method: 'POST',
            headers: buildJsonHeaders(getToken()),
            body: JSON.stringify(sourceContent),
          }
        );

        if (!createResponse.ok) {
          if (createResponse.status === 409) {
            return mcpError(
              `Target document with ID ${targetId} already exists. Choose a different ID or delete the existing document first.`
            );
          }
          return mcpError(
            `Failed to create duplicate document. HTTP error: ${createResponse.status} ${createResponse.statusText}`
          );
        }

        return mcpSuccess(
          `Document ${sourceId} successfully duplicated to ${targetId}.`
        );
      } catch (error) {
        return mcpError(
          `Error duplicating document: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  );
}
