export type QueryValue = string | number | boolean | undefined;
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD';
export type StatusMessages = Partial<Record<number, string>>;

export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('BASE_URL must not be empty');
  return trimmed;
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, QueryValue>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const queryString = params.size > 0 ? `?${params.toString()}` : '';
  return `${normalizeBaseUrl(baseUrl)}${path}${queryString}`;
}

export class CollabHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;
  readonly correlationId: string | undefined;
  readonly method: string;
  readonly url: string;

  constructor(init: {
    status: number;
    statusText: string;
    body: string;
    correlationId: string | undefined;
    method: string;
    url: string;
  }) {
    super(`HTTP ${init.status} for ${init.method} ${init.url}`);
    this.name = 'CollabHttpError';
    this.status = init.status;
    this.statusText = init.statusText;
    this.body = init.body;
    this.correlationId = init.correlationId;
    this.method = init.method;
    this.url = init.url;
  }
}

// A 2xx response whose body was empty or not JSON when JSON was expected.
export class CollabBodyError extends Error {
  readonly status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'CollabBodyError';
    this.status = status;
  }
}

export interface CollabRequest {
  method?: HttpMethod;
  headers: Record<string, string>;
  body?: BodyInit;
  query?: Record<string, QueryValue>;
}

export async function collabFetch(
  baseUrl: string,
  path: string,
  init: CollabRequest
): Promise<Response> {
  const url = buildUrl(baseUrl, path, init.query);
  const method = init.method ?? 'GET';
  const response = await fetch(url, {
    method,
    headers: init.headers,
    body: init.body,
  });

  if (!response.ok) {
    let body = '';
    try {
      body = (await response.text()).trim();
    } catch {
      // unreadable body: report the status alone
    }
    throw new CollabHttpError({
      status: response.status,
      statusText: response.statusText,
      body,
      correlationId: response.headers.get('x-correlation-id') ?? undefined,
      method,
      url,
    });
  }

  return response;
}

export async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (response.status === 204 || text.trim() === '') {
    throw new CollabBodyError(response.status, 'empty body');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new CollabBodyError(
      response.status,
      `invalid JSON: ${text.slice(0, 200)}`
    );
  }
}

export function formatToolError(
  prefix: string,
  error: unknown,
  statusMessages?: StatusMessages
): string {
  if (error instanceof CollabHttpError) {
    const statusText = error.statusText ? ` ${error.statusText}` : '';
    const correlation = error.correlationId
      ? `, correlation-id ${error.correlationId}`
      : '';
    const suffix = `[HTTP ${error.status}${statusText}${correlation}]`;

    const mapped = statusMessages?.[error.status];
    if (mapped) return `${prefix}: ${mapped} ${suffix}`;
    if (error.status === 401) {
      return `${prefix}: Unauthorized - check API_TOKEN. ${suffix}`;
    }
    if (error.status === 501) {
      return `${prefix}: Not implemented on this server. ${suffix}`;
    }
    if (error.body) {
      return `${prefix}: Request failed: ${error.body.slice(0, 300)} ${suffix}`;
    }
    return `${prefix}: Request failed. ${suffix}`;
  }

  if (error instanceof CollabBodyError) {
    return `${prefix}: Unexpected response body (${error.message}) [HTTP ${error.status}]`;
  }

  if (error instanceof Error) return `${prefix}: ${error.message}`;
  return `${prefix}: Unknown error`;
}
