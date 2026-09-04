import { vi, type Mock } from 'vitest';

export type FetchMock = Mock<typeof fetch>;

export function installFetchMock(): FetchMock {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headersInit(headers) },
  });
}

export function textResponse(
  text: string,
  status: number,
  headers?: HeadersInit,
  statusText = ''
): Response {
  return new Response(text, { status, statusText, headers });
}

// Node throws on new Response('', { status: 204 }); the body must be null.
export function emptyResponse(status: number, headers?: HeadersInit): Response {
  return new Response(null, { status, headers });
}

export interface CapturedRequest {
  url: string;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
}

export function capturedRequest(mock: FetchMock, index = 0): CapturedRequest {
  const call = mock.mock.calls[index];
  if (!call) throw new Error(`fetch call ${index} was not made`);
  const [input, init] = call;
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return {
    url,
    method: init?.method ?? 'GET',
    headers: new Headers(init?.headers),
    body: init?.body,
  };
}

function headersInit(headers?: HeadersInit): Record<string, string> {
  return headers ? Object.fromEntries(new Headers(headers)) : {};
}
