# architect Plan: Parameterized runtime enqueue: run a named resource with per-request parameter values (no full POST /api/config)

Main plan: [plan.md](plan.md)

## Shared contracts

Document exactly the request/response contract from the main plan's "Shared
contracts" section — no divergent wording, no additional fields not listed
there. This doc is what `navi-client`/`docs` and any external integrator treat
as the source of truth for `/api/*`.

## Implementation Steps

### Step 1 — Update `docs/agents/web-server.md`'s `POST /api/engine/start` subsection

Update the existing `### POST /api/engine/start` subsection (and its worked
`targets[]` JSON example) to document:

- the string-or-`{name, parameters}` `resources[]` entry shape, and the
  target-level `parameters` default with its shallow-merge rule (per-resource
  wins on key conflict) — include a worked example mirroring the one in the main
  plan's "Shared contracts" section;
- accepted parameter value types (`string`/`number`/`boolean`/`null`, with
  `null` and an absent key both meaning "missing" while an empty string is a
  present value substituted as-is) and that object/array values 400;
- `needs_params` now also covering "the resource still has an unresolved token
  after the parameters were merged in", and the additive `parameters` key on a
  `skippedResources` entry (with the same worked example as the main plan);
- that `enqueued` stays a plain `string[]` and may contain the same name more
  than once when it was listed more than once in the request;
- a short note that values are substituted verbatim into the URL (not
  URL-encoded) and that the token-secured caller is responsible for sanitizing
  any untrusted input it forwards;
- that bulk enqueue (a target with no `resources` list) is unaffected by a
  target-level `parameters` default — it stays param-free-only.

Do not restructure the surrounding `## /api namespace` section beyond what's
needed to fit this; match the existing doc's tone (prose + fenced JSON
examples + a closing paragraph of caveats), consistent with how
`POST /api/config` is documented directly above it.

## Files to Change

- `docs/agents/web-server.md` — the `### POST /api/engine/start` subsection.

## Notes

- This is the one file in this plan living under `docs/agents/*`, which is
  `architect`'s scope (contributor/agent-facing internals documentation) even
  though the feature it describes is implemented by `engine` — see this repo's
  established precedent (e.g. the `docs/agents/web-server.md` update landing
  alongside the extension-routes feature, co-authored by `architect` and
  `engine`).
- Coordinate with `engine`'s finished implementation (steps 01–04 in
  [engine.md](engine.md)) before finalizing wording — the exact validation
  error triggers and skip-reason semantics must match what was actually built,
  not just what was planned.
