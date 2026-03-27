# Tiptap Collaboration MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Tiptap Collaboration services.

## Tools Available

### Statistics
#### `get-server-statistics`
Get server-wide usage statistics.
- **Parameters**: None
- **Returns**: Total documents, connections, concurrent users, version info

#### `get-document-statistics`
Get real-time statistics for a specific document.
- **Parameters**:
  - `id` (string): Document ID
- **Returns**: Current connections, connected IPs, document activity

### Document Management
#### `create-document`
Create a new collaborative document.
- **Parameters**:
  - `name` (string): Name of the document
  - `content` (object, optional): Initial content for the document in Tiptap JSON format
- **Returns**: Created document information

#### `get-document`
Retrieve information about a specific collaborative document.
- **Parameters**:
  - `id` (string): ID of the document to retrieve
- **Returns**: Document information and content

#### `list-documents`
List all available collaborative documents.
- **Parameters**: None
- **Returns**: Array of all documents in the system

#### `update-document`
Update a collaborative document with new content.
- **Parameters**:
  - `id` (string): Document ID
  - `content` (object): Document content in Tiptap JSON format
  - `mode` (string, optional): Update mode - "replace" or "append" (default: "replace")
- **Returns**: Updated document information

#### `delete-document`
Delete a collaborative document.
- **Parameters**:
  - `id` (string): ID of the document to delete
- **Returns**: Deletion confirmation

### Advanced Document Operations
#### `duplicate-document`
Duplicate an existing collaborative document.
- **Parameters**:
  - `sourceId` (string): ID of the source document to duplicate
  - `targetId` (string): ID for the new duplicated document
- **Returns**: Duplicated document information

#### `search-documents`
Search documents using semantic search (requires Tiptap Semantic Search).
- **Parameters**:
  - `query` (string): Search query
  - `limit` (number, optional): Maximum results to return (default: 10)
- **Returns**: Array of matching documents with relevance scores

### Markdown Conversion
#### `import-markdown`
Convert Markdown content to Tiptap JSON format.
- **Parameters**:
  - `appId` (string): Your Tiptap App ID for the conversion service
  - `content` (string): Markdown content to convert
  - `format` (string, optional): "md" or "gfm" (GitHub Flavored Markdown, default: "md")
- **Returns**: Converted Tiptap JSON content

#### `export-markdown`
Convert Tiptap JSON content to Markdown format.
- **Parameters**:
  - `appId` (string): Your Tiptap App ID for the conversion service
  - `content` (object): Tiptap JSON content to convert
  - `format` (string, optional): "md" or "gfm" (GitHub Flavored Markdown, default: "md")
- **Returns**: Converted Markdown content

## Installation

 ```bash
 git clone <repository-url>
 cd tiptap-collaboration-mcp
 npm install
 npm run build
 ```

## Configuration

The server requires both a BASE_URL and API_TOKEN to connect to your Tiptap collaboration service.

### Required Parameters

#### BASE_URL (Required)
The base URL of your Tiptap collaboration service. This parameter is **required** and the server will exit if not provided.

#### API_TOKEN (Recommended)
API token for authentication with the Tiptap collaboration service. While not strictly required, most operations will fail without proper authentication.

### Command Line Usage

```bash
node /path/to/build/index.js BASE_URL <url> API_TOKEN <token>
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

## Resources

- [ModelContextProtocol](https://modelcontextprotocol.io)
- [ModelContextProtocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Tiptap Collaboration API](https://github.com/tiptap-collaboration/api)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
