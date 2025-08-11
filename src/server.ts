import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import registerBatchImportDocuments from './tools/batch_import_documents.js';
import registerCreateDocument from './tools/create_document.js';
import registerDeleteDocument from './tools/delete_document.js';
import registerDuplicateDocument from './tools/duplicate_document.js';
import registerEncryptDocument from './tools/encrypt_document.js';
import registerExportMarkdown from './tools/export_markdown.js';
import registerGetCollaborationHealth from './tools/get_collaboration_health.js';
import registerGetDocument from './tools/get_document.js';
import registerGetDocumentStatistics from './tools/get_document_statistics.js';
import registerGetServerStatistics from './tools/get_server_statistics.js';
import registerImportMarkdown from './tools/import_markdown.js';
import registerListDocuments from './tools/list_documents.js';
import registerSearchDocuments from './tools/search_documents.js';
import registerUpdateDocument from './tools/update_document.js';

let API_TOKEN: string | undefined;
let BASE_URL: string | undefined;

const server = new McpServer({
  name: 'tiptap-collaboration-mcp',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Exported setters to configure API token and base URL
export function setApiToken(token: string) {
  API_TOKEN = token;
}
const getToken = () => API_TOKEN;
export function setBaseUrl(url: string) {
  BASE_URL = url;
}
const getBaseUrl = () => {
  if (!BASE_URL) {
    throw new Error(
      'BASE_URL is required but not configured. Please provide BASE_URL argument.'
    );
  }
  return BASE_URL;
};

registerBatchImportDocuments(server, getBaseUrl, getToken);
registerCreateDocument(server, getBaseUrl, getToken);
registerDeleteDocument(server, getBaseUrl, getToken);
registerDuplicateDocument(server, getBaseUrl, getToken);
registerEncryptDocument(server, getBaseUrl, getToken);
registerExportMarkdown(server, getBaseUrl, getToken);
registerGetCollaborationHealth(server, getBaseUrl, getToken);
registerGetDocument(server, getBaseUrl, getToken);
registerGetDocumentStatistics(server, getBaseUrl, getToken);
registerGetServerStatistics(server, getBaseUrl, getToken);
registerImportMarkdown(server, getBaseUrl, getToken);
registerListDocuments(server, getBaseUrl, getToken);
registerSearchDocuments(server, getBaseUrl, getToken);
registerUpdateDocument(server, getBaseUrl, getToken);

export default server;
