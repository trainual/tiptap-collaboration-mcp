import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import registerCreateDocument from './tools/create-document.js';
import registerDeleteDocument from './tools/delete-document.js';
import registerDuplicateDocument from './tools/duplicate-document.js';
import registerExportMarkdown from './tools/export-markdown.js';
import registerGetDocument from './tools/get-document.js';
import registerGetDocumentStatistics from './tools/get-document-statistics.js';
import registerGetServerStatistics from './tools/get-server-statistics.js';
import registerImportMarkdown from './tools/import-markdown.js';
import registerListDocuments from './tools/list-documents.js';
import registerSearchDocuments from './tools/search-documents.js';
import registerUpdateDocument from './tools/update-document.js';
import { normalizeBaseUrl } from './utils/collab-request.js';
import { packageVersion } from './utils/package-info.js';

let API_TOKEN: string | undefined;
let BASE_URL: string | undefined;
let CONVERT_TOKEN: string | undefined;
let CONVERT_URL = 'https://api.tiptap.dev';

const server = new McpServer({
  name: 'tiptap-collaboration-mcp',
  version: packageVersion,
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Exported setters to configure tokens and URLs
export function setApiToken(token: string) {
  API_TOKEN = token;
}
const getToken = () => API_TOKEN;
export function setBaseUrl(url: string) {
  BASE_URL = normalizeBaseUrl(url);
}
const getBaseUrl = () => {
  if (!BASE_URL) {
    throw new Error(
      'BASE_URL is required but not configured. Please provide BASE_URL argument.'
    );
  }
  return BASE_URL;
};
export function setConvertToken(token: string) {
  CONVERT_TOKEN = token;
}
const getConvertToken = () => CONVERT_TOKEN;
export function setConvertUrl(url: string) {
  CONVERT_URL = normalizeBaseUrl(url);
}
const getConvertUrl = () => CONVERT_URL;

registerCreateDocument(server, getBaseUrl, getToken);
registerDeleteDocument(server, getBaseUrl, getToken);
registerDuplicateDocument(server, getBaseUrl, getToken);
registerExportMarkdown(server, getConvertUrl, getConvertToken);
registerGetDocument(server, getBaseUrl, getToken);
registerGetDocumentStatistics(server, getBaseUrl, getToken);
registerGetServerStatistics(server, getBaseUrl, getToken);
registerImportMarkdown(server, getConvertUrl, getConvertToken);
registerListDocuments(server, getBaseUrl, getToken);
registerSearchDocuments(server, getBaseUrl, getToken);
registerUpdateDocument(server, getBaseUrl, getToken);

export default server;
