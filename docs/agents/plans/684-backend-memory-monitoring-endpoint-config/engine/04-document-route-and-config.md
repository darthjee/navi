# Document the new route and config

Update the internal architecture doc that already catalogs every web-server route and config key,
so it stays accurate. This is `docs/agents/web-server.md`, not the user-facing README/DOCKERHUB
docs the issue explicitly excludes.

- Add a row to the routes table: `GET` / `/memory/status.json` / short description.
- Add a `### GET /memory/status.json` subsection (mirroring the existing `/engine/start`
  subsection's style) documenting: the response shape, that `percentage`/`status` use inclusive
  threshold boundaries, and the `maximum` fallback chain (Config → cgroup v2 → cgroup v1 → OS
  total memory).
- Extend the `## Configuration` YAML example with a `web.memory` block (`maximum`, `thresholds`),
  and a sentence noting the ascending-order validation and its boot-time failure.

## Files to Change

- `docs/agents/web-server.md` — add the route table row, the new subsection, and the config
  example/notes described above.
