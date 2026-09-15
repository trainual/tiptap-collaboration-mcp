import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import {
  connectTestClient,
  type TestMcpClient,
} from '../helpers/mcp-client.js';
import {
  capturedRequest,
  emptyResponse,
  installFetchMock,
  textResponse,
  type FetchMock,
} from '../helpers/fetch-mock.js';
import { setConvertToken } from '../../src/server.js';

const BASE_URL = 'http://collab.test:8080';
const CONVERT_TOKEN = 'convert-jwt';
const content = { type: 'doc', content: [{ type: 'paragraph' }] };

describe('export-markdown', () => {
  let mcp: TestMcpClient;
  let fetchMock: FetchMock;

  beforeAll(async () => {
    mcp = await connectTestClient({
      baseUrl: BASE_URL,
      token: 'collab-secret',
      convertToken: CONVERT_TOKEN,
    });
  });
  afterAll(async () => {
    await mcp.close();
  });
  beforeEach(() => {
    fetchMock = installFetchMock();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the JSON content and returns the converted markdown', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('# hi', 200));

    const result = await mcp.callTool('export-markdown', { content });

    expect(result).toEqual({
      isError: false,
      text: 'Tiptap JSON exported to Markdown successfully:\n\n# hi',
    });

    const req = capturedRequest(fetchMock);
    expect(req.method).toBe('POST');
    expect(req.url).toBe('https://api.tiptap.dev/v2/convert/export/markdown');
    expect(req.headers.get('authorization')).toBe(`Bearer ${CONVERT_TOKEN}`);
    expect(req.headers.get('content-type')).toBe('application/json');
    expect(req.headers.get('x-app-id')).toBeNull();
    expect(req.body).toBe(JSON.stringify({ doc: JSON.stringify(content) }));
  });

  it('sets the X-App-Id header when an appId is provided', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('# hi', 200));

    await mcp.callTool('export-markdown', { content, appId: 'app1' });

    expect(capturedRequest(fetchMock).headers.get('x-app-id')).toBe('app1');
  });

  it('reports rejected credentials on a 401', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(401));

    const result = await mcp.callTool('export-markdown', { content });

    expect(result).toEqual({
      isError: true,
      text: 'Error exporting to markdown: Conversion service rejected the credentials - CONVERT_TOKEN must be a valid Tiptap Cloud Convert JWT. [HTTP 401]',
    });
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('export-markdown', { content });
    expect(result).toEqual({
      isError: true,
      text: 'Error exporting to markdown: fetch failed',
    });
  });

  it('refuses to run without a CONVERT_TOKEN configured', async () => {
    setConvertToken('');
    try {
      const result = await mcp.callTool('export-markdown', { content });
      expect(result.isError).toBe(true);
      expect(
        result.text.startsWith('export-markdown requires CONVERT_TOKEN')
      ).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      setConvertToken(CONVERT_TOKEN);
    }
  });
});
