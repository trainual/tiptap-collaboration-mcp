import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  connectTestClient,
  type TestMcpClient,
} from '../helpers/mcp-client.js';
import { buildHeaders } from '../../src/utils/mcp-helpers.js';

// Runs the real tools against a real collaboration server:
//   TIPTAP_TEST_BASE_URL=http://localhost:8081 \
//   TIPTAP_TEST_API_TOKEN=<API_SECRET> npm run test:live
// Optional: TIPTAP_TEST_CONVERT_TOKEN=<Tiptap Cloud Convert JWT> to exercise
// the conversion tools for real.
const baseUrl = process.env.TIPTAP_TEST_BASE_URL;
const token = process.env.TIPTAP_TEST_API_TOKEN;
const convertToken = process.env.TIPTAP_TEST_CONVERT_TOKEN;
const live = Boolean(baseUrl && token);

it.skipIf(live)(
  'live suite skipped: set TIPTAP_TEST_BASE_URL and TIPTAP_TEST_API_TOKEN to run',
  () => {}
);

describe.skipIf(!live)(
  'live: tiptap collaboration server',
  { timeout: 15_000 },
  () => {
    const runId = `mcp-live-${Date.now()}-${process.pid}`;
    const docName = runId;
    const copyName = `${runId}-copy`;
    const dupeName = `${runId}-dupe`;
    const created: string[] = [];
    let mcp: TestMcpClient;

    const doc = (text: string) => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });

    beforeAll(async () => {
      const sanity = await fetch(`${baseUrl}/api/statistics`, {
        headers: buildHeaders(token),
      });
      if (!sanity.ok) {
        throw new Error(
          `cannot reach live server at ${baseUrl}: HTTP ${sanity.status}`
        );
      }
      mcp = await connectTestClient({
        baseUrl: baseUrl as string,
        token,
        convertToken,
      });
    });

    afterAll(async () => {
      // Cleanup must not depend on the tools under test.
      for (const name of created) {
        await fetch(`${baseUrl}/api/documents/${encodeURIComponent(name)}`, {
          method: 'DELETE',
          headers: buildHeaders(token),
        }).catch(() => {});
      }
      await mcp.close();
    });

    it('get-server-statistics reports the server version', async () => {
      const result = await mcp.callTool('get-server-statistics');
      expect(result.isError).toBe(false);
      expect(result.text).toContain('"version"');
    });

    it('list-documents returns a JSON array', async () => {
      const result = await mcp.callTool('list-documents');
      expect(result.isError).toBe(false);
      expect(
        JSON.parse(result.text.replace(/^Documents: /, ''))
      ).toBeInstanceOf(Array);
    });

    it('creates a document', async () => {
      created.push(docName);
      const result = await mcp.callTool('create-document', {
        name: docName,
        content: doc('hello'),
      });
      expect(result).toEqual({
        isError: false,
        text: `Document '${docName}' created successfully.`,
      });
    });

    it('reads it back', async () => {
      const result = await mcp.callTool('get-document', { id: docName });
      expect(result.isError).toBe(false);
      expect(result.text).toContain('"hello"');
    });

    it('reports its statistics', async () => {
      const result = await mcp.callTool('get-document-statistics', {
        id: docName,
      });
      expect(result.isError).toBe(false);
      expect(result.text).toContain('"currentConnections"');
    });

    it('updates it (replace)', async () => {
      const result = await mcp.callTool('update-document', {
        id: docName,
        content: doc('updated'),
      });
      expect(result.isError).toBe(false);
      const readBack = await mcp.callTool('get-document', { id: docName });
      expect(readBack.text).toContain('"updated"');
      expect(readBack.text).not.toContain('"hello"');
    });

    it('duplicates it', async () => {
      created.push(copyName);
      const result = await mcp.callTool('duplicate-document', {
        sourceId: docName,
        targetId: copyName,
      });
      expect(result.isError).toBe(false);
      const copy = await mcp.callTool('get-document', { id: copyName });
      expect(copy.text).toContain('"updated"');
    });

    it('deletes both, and the deleted document is gone', async () => {
      for (const name of [copyName, docName]) {
        const result = await mcp.callTool('delete-document', { id: name });
        expect(result.isError).toBe(false);
      }
      const gone = await mcp.callTool('get-document', { id: docName });
      expect(gone.isError).toBe(true);
      expect(gone.text).toMatch(/not found/);
      expect(gone.text).toMatch(/\[HTTP 404/);
    });

    it('rejects a duplicate create with 409', async () => {
      created.push(dupeName);
      await mcp.callTool('create-document', { name: dupeName });
      const second = await mcp.callTool('create-document', { name: dupeName });
      expect(second.isError).toBe(true);
      expect(second.text).toMatch(/already exists/);
    });

    it('reports not found for updates to a missing document', async () => {
      const result = await mcp.callTool('update-document', {
        id: `${runId}-missing`,
        content: doc('x'),
      });
      expect(result.isError).toBe(true);
      expect(result.text).toMatch(/not found/);
    });

    it('statistics for a missing document: not-found on 3.91+, zeroes before', async () => {
      const result = await mcp.callTool('get-document-statistics', {
        id: `${runId}-missing`,
      });
      if (result.isError) {
        expect(result.text).toMatch(/not found/);
      } else {
        // pre-3.91.0 servers have no HEAD endpoint to check existence with
        expect(result.text).toContain('"currentConnections": 0');
      }
    });

    it('search-documents succeeds or explains it is a Cloud feature', async () => {
      const result = await mcp.callTool('search-documents', {
        query: 'hello',
      });
      if (result.isError) {
        expect(result.text).toMatch(/Tiptap Cloud/);
        expect(result.text).not.toMatch(/Request failed/);
      }
    });

    it('conversion tools convert for real or ask for CONVERT_TOKEN', async () => {
      const imported = await mcp.callTool('import-markdown', {
        content: '# hi',
      });
      const exported = await mcp.callTool('export-markdown', {
        content: doc('hi'),
      });
      if (convertToken) {
        expect(imported.isError).toBe(false);
        expect(imported.text).toContain('"type": "doc"');
        expect(exported.isError).toBe(false);
      } else {
        expect(imported.text).toMatch(/requires CONVERT_TOKEN/);
        expect(exported.text).toMatch(/requires CONVERT_TOKEN/);
      }
    });
  }
);
