# Specs

Specs are guidelines for planned-but-not-yet-implemented work, kept while that work is being
developed. Each spec is removed once its work is implemented and documented in its permanent
place. This hub itself is permanent.

## Conventions

- One file per topic:

  ```
  docs/agents/specs/<topic>.md
  ```

- If a spec grows too large, split it into a hub + subfolder (see
  [`specs/crawler.md`](specs/crawler.md) and `specs/crawler/` for an example), the same pattern
  used by `architecture.md`, `flow.md`, and `contributing.md`.
- Once the feature is implemented and documented in its permanent place, its spec is removed.
  The `docs/agents/specs/` folder itself is permanent.
- Every new spec must add a row to the table below. When a spec is deleted, its row
  is removed in the same change.
- The table links only each spec's top-level `specs/<topic>.md`, never its subfiles. A split
  spec's own hub lists its topic files.
- When no specs exist, the table is replaced by the line `_No specs at the moment._`, while the
  intro and these conventions stay.

## Specs

| Spec | Description |
|---|---|
| [Crawler](specs/crawler.md) | Information crawling & data emission (incomplete design). |
| [Release](specs/release.md) | Release-cycle overhaul: X.Y.Z-only releases, per-package detection and cascade bumps (epic #977). |
