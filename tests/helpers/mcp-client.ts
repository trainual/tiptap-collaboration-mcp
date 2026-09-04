import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import server, {
  setApiToken,
  setBaseUrl,
  setConvertToken,
  setConvertUrl,
} from '../../src/server.js';

export interface ToolCallOutcome {
  text: string;
  isError: boolean;
}

export interface TestMcpClient {
  client: Client;
  callTool(
    name: string,
    args?: Record<string, unknown>
  ): Promise<ToolCallOutcome>;
  close(): Promise<void>;
}

// Connects the real McpServer singleton to an in-memory client. Vitest
// isolates module state per test file, so call this once per file
// (beforeAll) and close in afterAll.
export async function connectTestClient(config: {
  baseUrl: string;
  token?: string;
  convertUrl?: string;
  convertToken?: string;
}): Promise<TestMcpClient> {
  setBaseUrl(config.baseUrl);
  if (config.token) setApiToken(config.token);
  if (config.convertUrl) setConvertUrl(config.convertUrl);
  if (config.convertToken) setConvertToken(config.convertToken);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'tiptap-mcp-tests', version: '0.0.0' });
  await client.connect(clientTransport);

  return {
    client,
    async callTool(name, args = {}) {
      const parsed = CallToolResultSchema.parse(
        await client.callTool({ name, arguments: args })
      );
      const text = parsed.content
        .flatMap((item) => (item.type === 'text' ? [item.text] : []))
        .join('\n');
      return { text, isError: parsed.isError === true };
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}
