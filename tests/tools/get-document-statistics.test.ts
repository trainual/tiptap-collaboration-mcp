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
const stats = { connections: 2, ips: ['1.1.1.1'] };

describe('get-document-statistics', () => {
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

  it('HEADs the document then GETs its statistics', async () => {
    fetchMock
      .mockResolvedValueOnce(emptyResponse(200))
      .mockResolvedValueOnce(jsonResponse(stats));

    const result = await mcp.callTool('get-document-statistics', {
      id: 'doc one',
    });

    expect(result).toEqual({
      isError: false,
      text: `Document Statistics for doc one: ${JSON.stringify(stats, null, 2)}`,
    });

    const headReq = capturedRequest(fetchMock, 0);
    expect(headReq.method).toBe('HEAD');
    expect(headReq.url).toBe(`${BASE_URL}/api/documents/doc%20one`);
    expect(headReq.headers.get('authorization')).toBe(TOKEN);

    const getReq = capturedRequest(fetchMock, 1);
    expect(getReq.method).toBe('GET');
    expect(getReq.url).toBe(`${BASE_URL}/api/documents/doc%20one/statistics`);
    expect(getReq.headers.get('authorization')).toBe(TOKEN);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports not found on a HEAD 404 and skips the statistics call', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(404));

    const result = await mcp.callTool('get-document-statistics', {
      id: 'missing',
    });

    expect(result).toEqual({
      isError: true,
      text: 'Error retrieving document statistics: Document with ID missing not found. [HTTP 404]',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the statistics call when HEAD is unsupported (501, pre-3.91.0 servers)', async () => {
    fetchMock
      .mockResolvedValueOnce(emptyResponse(501))
      .mockResolvedValueOnce(jsonResponse(stats));

    const result = await mcp.callTool('get-document-statistics', {
      id: 'old-server-doc',
    });

    expect(result.isError).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(capturedRequest(fetchMock, 0).method).toBe('HEAD');
    expect(capturedRequest(fetchMock, 1).method).toBe('GET');
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('get-document-statistics', {
      id: 'a',
    });
    expect(result).toEqual({
      isError: true,
      text: 'Error retrieving document statistics: fetch failed',
    });
  });
});
