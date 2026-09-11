# Issue: Docs: navi-client guides missing the parameterized runtime-enqueue example (#828/#829)

## Description

Commit 0b0fb91 (PR #829, closing #828 — "Parameterized runtime enqueue") added per-request `parameters` support to `POST /api/engine/start`: a `resources[]` entry can now be a `{ name, parameters }` object (not just a bare string), and a target can carry a target-level `parameters` default that per-resource `parameters` shallow-merge over. This lets a caller run an already-defined resource with `{:token}` values chosen at call time, instead of pushing a one-off definition via `POST /api/config`.

That commit updated the agent-facing spec (`docs/agents/web-server.md`), a one-line mention in `docs/guides/navi-client/reference.md`, and the `engineStart` JSDoc in `clients/node/client.js` — but not the user-facing `navi-client` walkthrough docs, which are the primary place an external caller would actually learn to use this (the client package needs no code changes to support it: the payload is forwarded as-is).

Checked and confirmed **not** affected: `docs/guides/how_to_use_navi.md` and `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` are both high-level indexes that defer request/response detail to the pages below and to `reference.md` (already updated) — no changes needed there.

## Problem

These files still only demonstrate the old bare-string `resources` form, with no example of the new `parameters` capability:

- `docs/guides/navi-client/library-usage.md` — the `engineStart` example and method table show only `targets: [{ namespace, resources: ['categories'] }]`.
- `docs/guides/navi-client/cli-usage.md` — same gap in the `-a engine-start` example.
- `clients/node/README.md` — mirrors `library-usage.md`'s example/table verbatim; same gap.
- `docs/guides/navi-client/samples/push-config-and-start.md` — the one runnable end-to-end sample using `engineStart`; a good place for a second sample (or a "Notes" addition) covering the parameterized form.

## Expected Behavior

- Add a `parameters`-bearing example (target-level default + per-resource override) to `library-usage.md` and `cli-usage.md`, and mirror the same into `clients/node/README.md`.
- Add a new dedicated sample, e.g. `docs/guides/navi-client/samples/parameterized-enqueue.md`, mirroring the existing samples' structure (Scenario/Code/What happens/Notes) and showing the parameterized call end-to-end — e.g. the crawler-collection use case from #828's own description (`{ namespace: 'crawler', parameters: { region: 'eu' }, resources: [{ name: 'collection', parameters: { slug: '...' } }] }`). Link it from `docs/guides/navi-client/samples.md`.
- Keep the existing bare-string examples too — this is additive, not a replacement (unchanged behavior for callers who don't use the feature).

Out of scope: `docs/guides/how_to_use_navi.md` and `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` — verified during triage that neither needs a change.
