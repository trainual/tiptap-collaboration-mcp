import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  CollabBodyError,
  CollabHttpError,
  buildUrl,
  collabFetch,
  formatToolError,
  normalizeBaseUrl,
  readJson,
} from '../../src/utils/collab-request.js';

describe('normalizeBaseUrl', () => {
  it('strips trailing slashes and whitespace', () => {
    expect(normalizeBaseUrl('http://host:8080/')).toBe('http://host:8080');
    expect(normalizeBaseUrl(' http://host:8080// ')).toBe('http://host:8080');
    expect(normalizeBaseUrl('http://host:8080')).toBe('http://host:8080');
  });

  it('throws on an empty URL', () => {
    expect(() => normalizeBaseUrl('  ')).toThrow('BASE_URL must not be empty');
  });
});

describe('buildUrl', () => {
  it('joins base, path and query', () => {
    expect(
      buildUrl('http://host:8080/', '/api/documents', {
        format: 'json',
        take: 5,
      })
    ).toBe('http://host:8080/api/documents?format=json&take=5');
  });

  it('drops undefined query values and omits an empty query string', () => {
    expect(
      buildUrl('http://host', '/api/documents', { format: undefined })
    ).toBe('http://host/api/documents');
    expect(buildUrl('http://host', '/api/documents')).toBe(
      'http://host/api/documents'
    );
  });

  it('keeps a path prefix on the base URL', () => {
    expect(buildUrl('http://host/collab', '/api/statistics')).toBe(
      'http://host/collab/api/statistics'
    );
  });
});

describe('collabFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws CollabHttpError with body and correlation id on !ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response('Invalid authorization', {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'X-Correlation-Id': 'corr-1' },
        })
      )
    );

    const error = await collabFetch('http://host', '/api/statistics', {
      headers: {},
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CollabHttpError);
    const httpError = error as CollabHttpError;
    expect(httpError.status).toBe(401);
    expect(httpError.statusText).toBe('Unauthorized');
    expect(httpError.body).toBe('Invalid authorization');
    expect(httpError.correlationId).toBe('corr-1');
    expect(httpError.method).toBe('GET');
    expect(httpError.url).toBe('http://host/api/statistics');
  });

  it('returns the response when ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('[]'))
    );
    const response = await collabFetch('http://host', '/api/documents', {
      headers: {},
    });
    expect(response.ok).toBe(true);
  });
});

describe('readJson', () => {
  it('parses a JSON body', async () => {
    await expect(readJson(new Response('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it('throws CollabBodyError on 204 / empty body', async () => {
    await expect(readJson(new Response(null, { status: 204 }))).rejects.toThrow(
      CollabBodyError
    );
    await expect(readJson(new Response('  '))).rejects.toThrow(CollabBodyError);
  });

  it('throws CollabBodyError on invalid JSON', async () => {
    await expect(readJson(new Response('not json'))).rejects.toThrow(
      /invalid JSON: not json/
    );
  });
});

describe('formatToolError', () => {
  const httpError = (
    status: number,
    overrides?: Partial<ConstructorParameters<typeof CollabHttpError>[0]>
  ) =>
    new CollabHttpError({
      status,
      statusText: '',
      body: '',
      correlationId: undefined,
      method: 'GET',
      url: 'http://host/api/x',
      ...overrides,
    });

  it('uses the mapped message with status and correlation id', () => {
    expect(
      formatToolError('Error', httpError(404, { correlationId: 'abc' }), {
        404: 'Not found.',
      })
    ).toBe('Error: Not found. [HTTP 404, correlation-id abc]');
  });

  it('has defaults for unmapped 401 and 501', () => {
    expect(formatToolError('Error', httpError(401))).toBe(
      'Error: Unauthorized - check API_TOKEN. [HTTP 401]'
    );
    expect(formatToolError('Error', httpError(501))).toBe(
      'Error: Not implemented on this server. [HTTP 501]'
    );
  });

  it('includes the response body and statusText for other statuses', () => {
    expect(
      formatToolError(
        'Error',
        httpError(500, { statusText: 'Internal Server Error', body: 'boom' })
      )
    ).toBe('Error: Request failed: boom [HTTP 500 Internal Server Error]');
    expect(formatToolError('Error', httpError(500))).toBe(
      'Error: Request failed. [HTTP 500]'
    );
  });

  it('formats CollabBodyError, plain Error and unknown values', () => {
    expect(
      formatToolError('Error', new CollabBodyError(200, 'empty body'))
    ).toBe('Error: Unexpected response body (empty body) [HTTP 200]');
    expect(formatToolError('Error', new TypeError('fetch failed'))).toBe(
      'Error: fetch failed'
    );
    expect(formatToolError('Error', 'nope')).toBe('Error: Unknown error');
  });
});
