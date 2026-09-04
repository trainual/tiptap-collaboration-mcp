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

describe('get-server-statistics', () => {
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

  it('GETs the statistics with no query and the raw token', async () => {
    const data = { documents: 12, connections: 3 };
    fetchMock.mockResolvedValueOnce(jsonResponse(data));

    const result = await mcp.callTool('get-server-statistics');

    expect(result).toEqual({
      isError: false,
      text: `Server Statistics: ${JSON.stringify(data, null, 2)}`,
    });
    const req = capturedRequest(fetchMock);
    expect(req.method).toBe('GET');
    expect(req.url).toBe(`${BASE_URL}/api/statistics`);
    expect(req.headers.get('authorization')).toBe(TOKEN);
    expect(req.headers.get('user-agent')).toBe('tiptap-collaboration-mcp');
    expect(req.headers.get('content-type')).toBeNull();
    expect(req.body).toBeUndefined();
  });

  it('reports unauthorized on a 401', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('', 401));
    const result = await mcp.callTool('get-server-statistics');
    expect(result.isError).toBe(true);
    expect(result.text).toBe(
      'Error retrieving server statistics: Unauthorized - check API_TOKEN. [HTTP 401]'
    );
  });

  it('falls back to a generic message that includes the response body on an unmapped status', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('boom', 500, undefined, 'Internal Server Error')
    );
    const result = await mcp.callTool('get-server-statistics');
    expect(result.text).toBe(
      'Error retrieving server statistics: Request failed: boom [HTTP 500 Internal Server Error]'
    );
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('get-server-statistics');
    expect(result).toEqual({
      isError: true,
      text: 'Error retrieving server statistics: fetch failed',
    });
  });
});
