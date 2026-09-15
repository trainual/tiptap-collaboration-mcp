---
description: Smoke test the tiptap-collaboration MCP tools against a live server. Use when user says "smoke test", "test tiptap", or "test mcp tools".
---

# Smoke Test Tiptap MCP Tools

Run through the tiptap-collaboration MCP tools sequentially to verify they work against the live server. Call each tool one at a time and report results.

Automated equivalent: `npm run test:live` with `TIPTAP_TEST_BASE_URL` and `TIPTAP_TEST_API_TOKEN` set (see README). This command still matters because it exercises the real stdio path through the host and `build/index.js` — run `npm run build` first.

## Test sequence

Run these steps IN ORDER. Wait for each to complete before the next. Use a unique doc name like `smoke-test-<timestamp>`.

1. **get-server-statistics** — call with no args. PASS if it returns stats.
2. **list-documents** — call with no args. PASS if it returns a list.
3. **create-document** — create a doc named `smoke-test-<timestamp>` with simple content: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"hello"}]}]}`. PASS if success message.
4. **get-document** — fetch the doc you just created by name. PASS if it returns the content.
5. **get-document-statistics** — fetch stats for the doc. PASS if it returns stats.
6. **update-document** — update the doc with new content: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"updated"}]}]}`. PASS if success.
7. **get-document** — fetch again to verify update took effect. PASS if content changed.
8. **duplicate-document** — duplicate to `smoke-test-<timestamp>-copy`. PASS if success.
9. **get-document** — fetch the copy to verify it exists. PASS if returns content.
10. **delete-document** — delete the copy. PASS if success.
11. **delete-document** — delete the original. PASS if success.
12. **get-document** on the deleted original — PASS only if it reports not found with an HTTP 404.
13. **get-document-statistics** with a made-up ID — on server 3.91+ PASS only if it reports not found; older servers return zeroes.
14. **search-documents** — search for "hello". PASS if it returns results or the explicit "Semantic search is not enabled on this server" message. A generic "Request failed" is a FAIL.
15. **import-markdown** and **export-markdown** with tiny inputs — PASS if they convert successfully (CONVERT_TOKEN configured) or return the explicit "requires CONVERT_TOKEN" guidance. Any other error is a FAIL.

## Output format

After running all tests, print a summary table:

```
| # | Tool                     | Result | Notes          |
|---|--------------------------|--------|----------------|
| 1 | get-server-statistics    | PASS   |                |
| 2 | list-documents           | PASS   |                |
...
```
