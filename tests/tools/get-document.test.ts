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
  jsonResponse,
  installFetchMock,
  textResponse,
  type FetchMock,
} from '../helpers/fetch-mock.js';

const BASE_URL = 'http://collab.test:8080';
const TOKEN = 'test-secret';

describe('get-document', () => {
  let mcp: TestMcpClient;
  let fetchMock: FetchMock;

  beforeAll(async () => {
    // trailing slash on purpose: setBaseUrl must normalize it
    mcp = await connectTestClient({ baseUrl: `${BASE_URL}/`, token: TOKEN });
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

  it('GETs with format query and the raw token, returning the document', async () => {
    const data = { id: 'doc one', name: 'doc one', version: 3 };
    fetchMock.mockResolvedValueOnce(jsonResponse(data));

    const result = await mcp.callTool('get-document', { id: 'doc one' });

    expect(result).toEqual({
      isError: false,
      text: `Document Information: ${JSON.stringify(data, null, 2)}`,
    });
    const req = capturedRequest(fetchMock);
    expect(req.method).toBe('GET');
    expect(req.url).toBe(`${BASE_URL}/api/documents/doc%20one?format=json`);
    expect(req.headers.get('authorization')).toBe(TOKEN);
    expect(req.headers.get('user-agent')).toBe('tiptap-collaboration-mcp');
    expect(req.headers.get('content-type')).toBeNull();
    expect(req.body).toBeUndefined();
  });

  it('reports not found on 404 and surfaces the correlation id', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('', 404, { 'X-Correlation-Id': 'corr-123' })
    );
    const result = await mcp.callTool('get-document', { id: 'missing' });
    expect(result.isError).toBe(true);
    expect(result.text).toBe(
      'Error retrieving document: Document with ID missing not found. [HTTP 404, correlation-id corr-123]'
    );
  });

  it('falls back to a generic message that includes the response body on an unmapped status', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('boom', 500, undefined, 'Internal Server Error')
    );
    const result = await mcp.callTool('get-document', { id: 'a' });
    expect(result.text).toBe(
      'Error retrieving document: Request failed: boom [HTTP 500 Internal Server Error]'
    );
    expect(result.text).not.toContain('not found');
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('get-document', { id: 'a' });
    expect(result).toEqual({
      isError: true,
      text: 'Error retrieving document: fetch failed',
    });
  });

  it('rejects a non-string id before any request is made', async () => {
    await expect(mcp.callTool('get-document', { id: 42 })).rejects.toThrow(
      /-32602|[Ii]nvalid/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
