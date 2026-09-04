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
const sourceContent = { type: 'doc', content: [{ type: 'paragraph' }] };

describe('duplicate-document', () => {
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

  it('GETs the source then POSTs its content to the target', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(sourceContent))
      .mockResolvedValueOnce(emptyResponse(201));

    const result = await mcp.callTool('duplicate-document', {
      sourceId: 'source one',
      targetId: 'target',
    });

    expect(result).toEqual({
      isError: false,
      text: 'Document source one successfully duplicated to target.',
    });

    const getReq = capturedRequest(fetchMock, 0);
    expect(getReq.method).toBe('GET');
    expect(getReq.url).toBe(
      `${BASE_URL}/api/documents/source%20one?format=json`
    );
    expect(getReq.headers.get('authorization')).toBe(TOKEN);
    expect(getReq.headers.get('content-type')).toBeNull();

    const postReq = capturedRequest(fetchMock, 1);
    expect(postReq.method).toBe('POST');
    expect(postReq.url).toBe(`${BASE_URL}/api/documents/target?format=json`);
    expect(postReq.headers.get('authorization')).toBe(TOKEN);
    expect(postReq.headers.get('content-type')).toBe('application/json');
    expect(postReq.body).toBe(JSON.stringify(sourceContent));
  });

  it('reports the source as not found on a GET 404 and does not attempt the POST', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(404));

    const result = await mcp.callTool('duplicate-document', {
      sourceId: 'missing',
      targetId: 'target',
    });

    expect(result).toEqual({
      isError: true,
      text: 'Error duplicating document: Source document with ID missing not found. [HTTP 404]',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a conflict on a POST 409 after a successful GET', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(sourceContent))
      .mockResolvedValueOnce(emptyResponse(409));

    const result = await mcp.callTool('duplicate-document', {
      sourceId: 'source',
      targetId: 'taken',
    });

    expect(result).toEqual({
      isError: true,
      text: 'Error duplicating document: Target document with ID taken already exists. Choose a different ID or delete the existing document first. [HTTP 409]',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('duplicate-document', {
      sourceId: 'a',
      targetId: 'b',
    });
    expect(result).toEqual({
      isError: true,
      text: 'Error duplicating document: fetch failed',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
