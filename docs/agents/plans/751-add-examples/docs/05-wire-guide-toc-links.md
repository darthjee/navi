# Wire `Samples` into the two guide TOCs

Add one bullet row to each top-level guide's `## Table of Contents` list, immediately
**before** the existing `Reference` row, matching the surrounding row style exactly
(`- [Title](path) — sentence ending in a period.`).

- `docs/guides/how_to_use_navi.md` — insert before the
  `- [Reference](./navi/reference.md) — …` line:

  `- [Samples](./navi/samples.md) — end-to-end, copy-paste recipes for cache warm-up and crawling.`

- `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` — insert before the
  `- [Reference](./navi-client/reference.md) — …` line:

  `- [Samples](./navi-client/samples.md) — end-to-end recipes for driving a running Navi instance.`

These two rows are the only references to either `samples.md` from above its own subtree.
Do not add a `Samples` link anywhere in the `navi/` tree that points at `navi-client/` or
vice versa.

## Files to Change

- `docs/guides/how_to_use_navi.md` — add the `Samples` TOC row.
- `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` — add the `Samples` TOC row.
