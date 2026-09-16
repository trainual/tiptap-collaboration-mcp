# Tiptap Collaboration MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Tiptap Collaboration services.

## Tools Available

### Statistics

#### `get-server-statistics`

Get server-wide usage statistics.

- **Parameters**: None
- **Returns**: Total documents, connections, concurrent users, and the collaboration server's version — useful for confirming which server you are talking to

#### `get-document-statistics`

Get real-time statistics for a specific document.

- **Parameters**:
  - `id` (string): Document ID
- **Returns**: Document size, version count, current connections, connected IPs
- **Note**: The server's statistics endpoint returns zeroes for nonexistent documents, so the tool first checks existence with a `HEAD` request (available since server 3.91.0). On older servers the check is skipped and a missing document reports zeroes.

### Document Management

#### `create-document`

Create a new collaborative document.

- **Parameters**:
  - `name` (string): Name of the document
  - `content` (object, optional): Initial content in Tiptap JSON format; defaults to `{"type": "doc", "content": [{"type": "paragraph"}]}`
- **Returns**: Creation confirmation (the server answers 204 with no body)

#### `get-document`

Retrieve a collaborative document.

- **Parameters**:
  - `id` (string): ID of the document to retrieve
- **Returns**: The document's Tiptap JSON content

#### `list-documents`

List all available collaborative documents.

- **Parameters**: None
- **Returns**: Array of documents (name, size, timestamps)

#### `update-document`

Update a collaborative document with new content.

- **Parameters**:
  - `id` (string): Document ID
  - `content` (object): Document content in Tiptap JSON format
  - `mode` (string, optional): Update mode - "replace" or "append" (default: "replace")
- **Returns**: Update confirmation (the server answers 204; the document is not echoed back)

#### `delete-document`

Delete a collaborative document.

- **Parameters**:
  - `id` (string): ID of the document to delete
- **Returns**: Deletion confirmation

### Advanced Document Operations

#### `duplicate-document`

Duplicate an existing collaborative document (fetches the source as JSON and creates the target from it; versions are not copied).

- **Parameters**:
  - `sourceId` (string): ID of the source document to duplicate
  - `targetId` (string): ID for the new duplicated document
- **Returns**: Duplication confirmation

#### `search-documents`

Search documents using semantic search.

- **Parameters**:
  - `query` (string): Search query
  - `limit` (number, optional): Maximum results, 1-100 (default: 10)
- **Returns**: Matching documents with relevance scores
- **Note**: Semantic search is a Tiptap Cloud restricted-beta feature. Self-hosted collaboration servers do not implement it; there the tool returns an explicit "not enabled on this server" error.

### Markdown Conversion

These two tools call the [Tiptap Conversion service](https://tiptap.dev/docs/conversion/getting-started/overview) (`https://api.tiptap.dev` by default), **not** the collaboration server. They require `CONVERT_TOKEN` (a Tiptap Cloud Convert JWT); without it they return setup guidance instead of making a request.

#### `import-markdown`

Convert Markdown content to Tiptap JSON format.

- **Parameters**:
  - `content` (string): Markdown content to convert
  - `appId` (string, optional): Tiptap Convert App ID
  - `format` (string, optional): Accepted for backwards compatibility; the v2 Conversion API has no format switch
- **Returns**: Converted Tiptap JSON content (plus the service's conversion logs)

#### `export-markdown`

Convert Tiptap JSON content to Markdown format.

- **Parameters**:
  - `content` (object): Tiptap JSON content to convert
  - `appId` (string, optional): Tiptap Convert App ID
  - `format` (string, optional): Accepted for backwards compatibility; the v2 Conversion API has no format switch
- **Returns**: Converted Markdown content

## Installation

```bash
git clone <repository-url>
cd tiptap-collaboration-mcp
npm install
npm run build
```

## Configuration

Configuration is passed as command-line arguments only (a `.env` file is not read).

| Argument        | Required    | Description                                                                                                                              |
| --------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_URL`      | Yes         | Base URL of your Tiptap collaboration server; the server exits without it. A trailing slash is fine.                                     |
| `API_TOKEN`     | Recommended | The collaboration server's API secret, sent as-is in the `Authorization` header (Tiptap's legacy auth). Most operations fail without it. |
| `CONVERT_TOKEN` | Optional    | Tiptap Cloud Convert JWT for `import-markdown` / `export-markdown`.                                                                      |
| `CONVERT_URL`   | Optional    | Conversion service base URL (default: `https://api.tiptap.dev`).                                                                         |

```bash
node /path/to/build/index.js BASE_URL <url> API_TOKEN <token> [CONVERT_TOKEN <jwt>] [CONVERT_URL <url>]
```

## Host Usage

Add this server to your Claude, Windsurf, or any other host with the relevant syntax. An example:

```json
"tiptap-collaboration": {
  "command": "node",
  "args": [
    "/path/to/tiptap-collaboration-mcp/build/index.js",
    "BASE_URL",
    "http://localhost:8080",
    "API_TOKEN",
    "your-actual-api-token"
  ]
}
```

## Development

```bash
npm run dev -- BASE_URL <url> API_TOKEN <token>   # run from source (tsx)
npm run inspect -- BASE_URL <url> API_TOKEN <token>   # MCP Inspector
npm run typecheck                                  # type-check src + tests
npm run format                                     # prettier
npm test                                           # unit tests (mocked fetch)
npm run test:live                                  # integration tests against a real server
```

The live suite is skipped unless pointed at a server:

```bash
TIPTAP_TEST_BASE_URL=http://localhost:8080 \
TIPTAP_TEST_API_TOKEN=<your API secret> \
npm run test:live
```

Set `TIPTAP_TEST_CONVERT_TOKEN` as well to exercise the conversion tools for real; without it they are asserted to return their setup guidance. The suite creates uniquely named `mcp-live-*` documents and deletes them afterwards.

## Limitations

- **Semantic search** (`search-documents`) only works against Tiptap Cloud servers with the restricted-beta Semantic Search feature enabled — it is not part of the self-hosted collaboration server image.
- **Markdown conversion** requires a Tiptap Cloud Convert JWT (`CONVERT_TOKEN`); the conversion service is separate from the collaboration server.
- Error messages include the HTTP status and the server's `X-Correlation-Id` (e.g. `[HTTP 404, correlation-id …]`) so failures can be matched against collaboration server logs.

## Resources

- [ModelContextProtocol](https://modelcontextprotocol.io)
- [ModelContextProtocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Tiptap Document management REST API](https://tiptap.dev/docs/collaboration/documents/rest-api)
- [Tiptap content injection REST API](https://tiptap.dev/docs/collaboration/documents/content-injection)
- [Tiptap collaboration server changelog / upgrade guide](https://tiptap-suite.notion.site/Upgrade-Guide-a553322f83eb402e968738540ec4130f)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
