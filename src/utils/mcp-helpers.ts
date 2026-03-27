export function buildHeaders(
  token?: string,
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'tiptap-collaboration-mcp',
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) headers['Authorization'] = token;

  return headers;
}

export function mcpError(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
    isError: true,
  };
}

export function mcpSuccess(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
  };
}
