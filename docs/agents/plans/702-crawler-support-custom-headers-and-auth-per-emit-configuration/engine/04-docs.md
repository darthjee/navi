# Update crawler docs

`emit` config is only documented under `docs/agents/future/crawler/` today, so the doc
surface is small.

## Changes

- `docs/agents/future/crawler/gaps.md` — gap **#7 ("Custom headers per `emit`")**: change
  **Status** from "to be defined" to resolved, in the same style as gap #6
  (`**Status: resolved in #675.**`). Reference #702 and summarise the outcome: optional
  `emit.headers` map, `$VAR` / `${VAR}` supported (resolved at config load like client
  headers), merged over client headers with `emit.headers` winning on conflict.
- `docs/agents/future/crawler/decisions.md` — the decisions table has a row
  ("`emit` uses **existing `clients`** from the YAML"). Add a row recording the
  header-merge decision: per-emit `emit.headers` merge over the client's headers,
  emit values win on key collision; motivation — per-emit auth/routing without cloning
  clients.
- `docs/agents/future/crawler/flows.md` / `scope.md` — optional: extend one `emit:` YAML
  example with a `headers:` block (e.g. `Authorization: Bearer $MAJORA_API_TOKEN`) so the
  feature is visible in an example. Keep it minimal; skip if it bloats the flow.

No change to `docs/guides/` — there is no user-facing `emit` config section yet. If one
is added later it should include `emit.headers` alongside `client` / `method` / `url`.

## Files to Change

- `docs/agents/future/crawler/gaps.md` — mark gap #7 resolved.
- `docs/agents/future/crawler/decisions.md` — add the header-merge decision row.
- `docs/agents/future/crawler/flows.md` — optional `headers:` in an emit example.
