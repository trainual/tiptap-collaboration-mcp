import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import server, {
  setApiToken,
  setBaseUrl,
  setConvertToken,
  setConvertUrl,
} from './server.js';

async function main() {
  const args = process.argv.slice(2);
  const argValue = (key: string): string | undefined => {
    const index = args.findIndex((arg) => arg === key);
    return index !== -1 ? args[index + 1] : undefined;
  };

  const apiToken = argValue('API_TOKEN');
  const baseUrl = argValue('BASE_URL');
  const convertToken = argValue('CONVERT_TOKEN');
  const convertUrl = argValue('CONVERT_URL');

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
      'Usage: node build/index.js API_TOKEN <token> BASE_URL <url> [CONVERT_TOKEN <jwt>] [CONVERT_URL <url>]'
    );
    process.exit(1);
  }

  // Optional Tiptap Conversion service credentials (import/export-markdown)
  if (convertToken) setConvertToken(convertToken);
  if (convertUrl) setConvertUrl(convertUrl);

  const transport = new StdioServerTransport();
  console.warn('Starting server...');
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
