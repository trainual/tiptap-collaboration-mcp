# Roadmap

Deferred capabilities, found while auditing this MCP against live collaboration servers 3.74.0 and 3.98.0 (self-hosted, legacy raw-secret auth). Each item notes the minimum server version or prerequisite. The authoritative per-version changelog is the [Tiptap Upgrade Guide](https://tiptap-suite.notion.site/Upgrade-Guide-a553322f83eb402e968738540ec4130f).

## Collaboration REST API

- **Upsert on update** — `PATCH /api/documents/:id?upsert=1` creates the document when missing instead of returning 404, removing the create-then-409-then-update dance. Server 3.87.3+.
- **Pagination for `list-documents`** — expose `take` / `skip` query params (`GET /api/documents?take=&skip=`, defaults 100/0). Works on 3.74+.
- **`get-document` options** — `format=text|yjs|base64`, repeatable `fragment`, and `version=N` query params (server 3.29.2+; `version=0` since 3.41.5). Also surface the `x-<fragment>-checksum` response header for optimistic updates.
- **`document-exists` tool** — `HEAD /api/documents/:id` (200/404), server 3.91.0+. Already used internally by `get-document-statistics`.
- **Versions tools** — list / get / create / revert via `/api/documents/:id/versions…`. Request bodies for create/update are undocumented (Tiptap defers to a Postman collection); probe against a live server first. Versions v2 (metadata in DB) landed in 3.79.2.
- **Content-injection modes** — `mode=node|attrs|delete`, `nodeAttributeName/Value` filters, `checksum` guard (3.32.0/3.49.0), `multi=1` multi-fragment create/update (3.81.0/3.88.0), `skipVersioning`, `user` attribution.
- **Search `threshold` param** — documented query param (0–1, default 0.5) for `search-documents`; needs a Tiptap Cloud server with the restricted-beta Semantic Search to verify, since self-hosted servers 501 the endpoint.
- **Search `limit` upper bound** — the current 1–100 schema bound mirrors the documented range; unverified against a live Cloud server.

## Conversion service

- **More formats** — the v2 Conversion API also supports DOCX import/export and PDF/ODT/EPUB export (`/v2/convert/export/pdf` etc.). Verify the markdown round trip end-to-end first once a Convert JWT is available (`TIPTAP_TEST_CONVERT_TOKEN` in the live suite).

## Configuration / tooling

- **Env-var configuration** — accept `BASE_URL` etc. from the environment in addition to argv (a stray `.env` file is currently read by nothing).
- **JWT (Bearer) auth for the collaboration server** — Tiptap Authentication for on-prem shipped server-side in 3.98.0 (docs say GA September 2026). The MCP currently sends the legacy raw secret; add a Bearer/JWT mode when the Trainual servers adopt it.
- **`skipVersioning` on API writes** — the MCP's create/update currently trigger auto-versioning on every API write (Trainual's own Rails client passes `skipVersioning: 1`). Consider exposing it once versions tools exist.
