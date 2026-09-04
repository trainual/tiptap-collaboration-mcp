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

const BASE_URL = 'http://collab.test:8080';
const TOKEN = 'test-secret';
const content = { type: 'doc', content: [{ type: 'paragraph' }] };

describe('update-document', () => {
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

  it('PATCHes with format/mode query, JSON body and the raw token', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(204));

    const result = await mcp.callTool('update-document', {
      id: 'doc one',
      content,
    });

    expect(result).toEqual({
      isError: false,
      text: 'Document with ID doc one updated successfully using replace mode.',
    });
    const req = capturedRequest(fetchMock);
    expect(req.method).toBe('PATCH');
    expect(req.url).toBe(
      `${BASE_URL}/api/documents/doc%20one?format=json&mode=replace`
    );
    expect(req.headers.get('authorization')).toBe(TOKEN);
    expect(req.headers.get('content-type')).toBe('application/json');
    expect(req.headers.get('user-agent')).toBe('tiptap-collaboration-mcp');
    expect(req.body).toBe(JSON.stringify(content));
  });

  it('passes mode=append through to the query string', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(204));
    const result = await mcp.callTool('update-document', {
      id: 'a',
      content,
      mode: 'append',
    });
    expect(result.text).toContain('using append mode');
    expect(capturedRequest(fetchMock).url).toBe(
      `${BASE_URL}/api/documents/a?format=json&mode=append`
    );
  });

  it('reports not found on 404 and surfaces the correlation id', async () => {
    fetchMock.mockResolvedValueOnce(
      emptyResponse(404, { 'X-Correlation-Id': 'corr-123' })
    );
    const result = await mcp.callTool('update-document', {
      id: 'missing',
      content,
    });
    expect(result.isError).toBe(true);
    expect(result.text).toBe(
      'Error updating document: Document with ID missing not found. [HTTP 404, correlation-id corr-123]'
    );
  });

  it('reports an invalid payload on 422 and a conflict on 409', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('Unprocessable', 422));
    let result = await mcp.callTool('update-document', { id: 'a', content });
    expect(result.text).toBe(
      'Error updating document: Invalid payload or update cannot be applied to document a. [HTTP 422]'
    );

    fetchMock.mockResolvedValueOnce(textResponse('Checksum mismatch.', 409));
    result = await mcp.callTool('update-document', { id: 'a', content });
    expect(result.text).toBe(
      'Error updating document: Document a changed concurrently; retry the update. [HTTP 409]'
    );
  });

  it('falls back to a generic message that includes the response body', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('boom', 500, undefined, 'Internal Server Error')
    );
    const result = await mcp.callTool('update-document', { id: 'a', content });
    expect(result.text).toBe(
      'Error updating document: Request failed: boom [HTTP 500 Internal Server Error]'
    );
  });

  it('surfaces network failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await mcp.callTool('update-document', { id: 'a', content });
    expect(result).toEqual({
      isError: true,
      text: 'Error updating document: fetch failed',
    });
  });

  it('rejects an invalid mode before any request is made', async () => {
    await expect(
      mcp.callTool('update-document', { id: 'a', content, mode: 'merge' })
    ).rejects.toThrow(/-32602|[Ii]nvalid/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
