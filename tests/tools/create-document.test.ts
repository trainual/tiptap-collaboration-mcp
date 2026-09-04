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
  jsonResponse,
  installFetchMock,
  textResponse,
  type FetchMock,
} from '../helpers/fetch-mock.js';

const BASE_URL = 'http://collab.test:8080';
const TOKEN = 'test-secret';
const content = { type: 'doc', content: [{ type: 'paragraph' }] };

describe('create-document', () => {
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

  it('POSTs with format query, JSON body and the raw token, reporting success on 204', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(204));

    const result = await mcp.callTool('create-document', {
      name: 'doc one',
      content,
    });

    expect(result).toEqual({
      isError: false,
      text: "Document 'doc one' created successfully.",
    });
    const req = capturedRequest(fetchMock);
    expect(req.method).toBe('POST');
    expect(req.url).toBe(`${BASE_URL}/api/documents/doc%20one?format=json`);
    expect(req.headers.get('authorization')).toBe(TOKEN);
    expect(req.headers.get('content-type')).toBe('application/json');
    expect(req.headers.get('user-agent')).toBe('tiptap-collaboration-mcp');
    expect(req.body).toBe(JSON.stringify(content));
  });

  it('defaults content to an empty paragraph doc when omitted', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(204));
    await mcp.callTool('create-document', { name: 'a' });
    expect(capturedRequest(fetchMock).body).toBe(
      JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })
    );
  });

  it('reports the created document on a 200 with a JSON body', async () => {
    const data = { id: 'a', name: 'a' };
    fetchMock.mockResolvedValueOnce(jsonResponse(data));
    const result = await mcp.callTool('create-document', {
      name: 'a',
      content,
    });
    expect(result.text).toBe(
      `Document created successfully: ${JSON.stringify(data, null, 2)}`
    );
  });

  it('reports a conflict on 409', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('Duplicate', 409));
    const result = await mcp.callTool('create-document', {
      name: 'a',
      content,
    });
    expect(result.isError).toBe(true);
    expect(result.text).toBe(
      'Error creating document: Document with name a already exists. Choose a different name or delete the existing document first. [HTTP 409]'
    );
  });

  it('falls back to a generic message that includes the response body on an unmapped status', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('boom', 500, undefined, 'Internal Server Error')
    );
    const result = await mcp.callTool('create-document', {
      name: 'a',
      content,
    });
    expect(result.text).toBe(
      'Error creating document: Request failed: boom [HTTP 500 Internal Server Error]'
    );
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('create-document', {
      name: 'a',
      content,
    });
    expect(result).toEqual({
      isError: true,
      text: 'Error creating document: fetch failed',
    });
  });

  it('rejects a non-object content before any request is made', async () => {
    await expect(
      mcp.callTool('create-document', { name: 'a', content: 'not-an-object' })
    ).rejects.toThrow(/-32602|[Ii]nvalid/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
