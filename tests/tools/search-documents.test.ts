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

const BASE_URL = 'http://collab.test:8080';
const TOKEN = 'test-secret';
const searchResults = { results: [{ id: 'doc-1', score: 0.9 }] };

describe('search-documents', () => {
  let mcp: TestMcpClient;
  let fetchMock: FetchMock;

  beforeAll(async () => {
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

  it('POSTs the query as content and defaults limit to 10', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(searchResults));

    const result = await mcp.callTool('search-documents', {
      query: 'hello world',
    });

    expect(result).toEqual({
      isError: false,
      text: `Search results for "hello world": ${JSON.stringify(searchResults, null, 2)}`,
    });

    const req = capturedRequest(fetchMock);
    expect(req.method).toBe('POST');
    expect(req.url).toBe(`${BASE_URL}/api/search?limit=10`);
    expect(req.headers.get('authorization')).toBe(TOKEN);
    expect(req.headers.get('content-type')).toBe('application/json');
    expect(req.body).toBe(JSON.stringify({ content: 'hello world' }));
  });

  it('passes an explicit limit through to the query string', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(searchResults));

    await mcp.callTool('search-documents', { query: 'hi', limit: 3 });

    const req = capturedRequest(fetchMock);
    expect(req.url).toBe(`${BASE_URL}/api/search?limit=3`);
    expect(req.body).toBe(JSON.stringify({ content: 'hi' }));
  });

  it('reports semantic search as unavailable on a 501', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(501));

    const result = await mcp.callTool('search-documents', { query: 'hi' });

    expect(result).toEqual({
      isError: true,
      text: 'Error searching documents: Semantic search is not enabled on this server (it is a Tiptap Cloud restricted-beta feature). [HTTP 501]',
    });
  });

  it('rejects limit 0 before any request is made', async () => {
    await expect(
      mcp.callTool('search-documents', { query: 'hi', limit: 0 })
    ).rejects.toThrow(/-32602|[Ii]nvalid/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a non-integer limit before any request is made', async () => {
    await expect(
      mcp.callTool('search-documents', { query: 'hi', limit: 3.7 })
    ).rejects.toThrow(/-32602|[Ii]nvalid/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('search-documents', { query: 'hi' });
    expect(result).toEqual({
      isError: true,
      text: 'Error searching documents: fetch failed',
    });
  });
});
