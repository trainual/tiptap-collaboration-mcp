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
  jsonResponse,
  type FetchMock,
} from '../helpers/fetch-mock.js';
import { setConvertToken } from '../../src/server.js';

const BASE_URL = 'http://collab.test:8080';
const CONVERT_TOKEN = 'convert-jwt';

describe('import-markdown', () => {
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

  it('POSTs the markdown as a form file and returns the converted content', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { content: { type: 'doc' } }, logs: {} })
    );

    const result = await mcp.callTool('import-markdown', {
      content: '# hi',
    });

    expect(result.isError).toBe(false);
    expect(result.text).toContain('Markdown imported successfully:');

    const req = capturedRequest(fetchMock);
    expect(req.method).toBe('POST');
    expect(req.url).toBe('https://api.tiptap.dev/v2/convert/import/markdown');
    expect(req.headers.get('authorization')).toBe(`Bearer ${CONVERT_TOKEN}`);
    expect(req.headers.get('x-app-id')).toBeNull();
    expect(req.body).toBeInstanceOf(FormData);
    expect((req.body as FormData).get('file')).toBeTruthy();
  });

  it('sets the X-App-Id header when an appId is provided', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { content: { type: 'doc' } }, logs: {} })
    );

    await mcp.callTool('import-markdown', { content: '# hi', appId: 'app1' });

    expect(capturedRequest(fetchMock).headers.get('x-app-id')).toBe('app1');
  });

  it('reports rejected credentials on a 401', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(401));

    const result = await mcp.callTool('import-markdown', { content: '# hi' });

    expect(result).toEqual({
      isError: true,
      text: 'Error importing markdown: Conversion service rejected the credentials - CONVERT_TOKEN must be a valid Tiptap Cloud Convert JWT. [HTTP 401]',
    });
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('import-markdown', { content: '# hi' });
    expect(result).toEqual({
      isError: true,
      text: 'Error importing markdown: fetch failed',
    });
  });

  it('refuses to run without a CONVERT_TOKEN configured', async () => {
    setConvertToken('');
    try {
      const result = await mcp.callTool('import-markdown', {
        content: '# hi',
      });
      expect(result.isError).toBe(true);
      expect(
        result.text.startsWith('import-markdown requires CONVERT_TOKEN')
      ).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      setConvertToken(CONVERT_TOKEN);
    }
  });
});
