import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import server, { setApiToken, setBaseUrl } from './server.js';

async function main() {
  const args = process.argv.slice(2);
  let apiToken: string | undefined;
  let baseUrl: string | undefined;

  // Look for API_TOKEN argument
  const tokenIndex = args.findIndex((arg) => arg === 'API_TOKEN');
  if (tokenIndex !== -1 && tokenIndex + 1 < args.length) {
    apiToken = args[tokenIndex + 1];
  }

  // Look for BASE_URL argument
  const baseUrlIndex = args.findIndex((arg) => arg === 'BASE_URL');
  if (baseUrlIndex !== -1 && baseUrlIndex + 1 < args.length) {
    baseUrl = args[baseUrlIndex + 1];
  }

  // Set the API token in the server if provided
  if (apiToken) {
    setApiToken(apiToken);
  } else {
    console.error('Warning: No API_TOKEN provided. Some operations may fail.');
  }

  // Set the base URL in the server - required
  if (baseUrl) {
    setBaseUrl(baseUrl);
  } else {
    console.error(
      'Error: BASE_URL is required. Please provide BASE_URL argument.'
    );
    console.error(
      'Usage: node build/index.js API_TOKEN <token> BASE_URL <url>'
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  console.log('Starting server...');
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
