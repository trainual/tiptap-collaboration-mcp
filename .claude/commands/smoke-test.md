---
description: Smoke test the tiptap-collaboration MCP tools against a live server. Use when user says "smoke test", "test tiptap", or "test mcp tools".
---

# Smoke Test Tiptap MCP Tools

Run through the tiptap-collaboration MCP tools sequentially to verify they work against the live server. Call each tool one at a time and report results.

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
12. **search-documents** — search for "hello". PASS if it returns results or a clear error about semantic search not being enabled.

## Output format

After running all tests, print a summary table:

```
| # | Tool                     | Result | Notes          |
|---|--------------------------|--------|----------------|
| 1 | get-server-statistics    | PASS   |                |
| 2 | list-documents           | PASS   |                |
...
```

Skip import-markdown and export-markdown as they require an appId we don't have.
