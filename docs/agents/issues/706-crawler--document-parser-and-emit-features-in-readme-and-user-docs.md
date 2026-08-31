# Issue: Crawler: document parser and emit features in README and user docs

## Context

The crawler feature (structured data extraction and emission via `parser`/`emit` YAML config) was implemented across #671 and its sub-issues (#673-#678, #700-#705, #707, #742), but is not documented in the main README or user-facing docs. Users have no way to discover or configure `parser`/`emit`, their retry/observability behavior, or the dashboard views that monitor them.

This issue was originally written before several sibling sub-issues of #699 landed, so its scope undersells the current feature surface. As of now, the implemented surface includes:

- **Parsers** (`parser.type`): `regex`, `json_path` (with `match`, `filter` incl. `equals`/`equals_field`, `fields`), and `css` (CSS selector, with `match`, `filter` incl. `equals`/`equals_field`, `fields`, and a fallback single-`field`/`attribute`/`trim` mode)
- **Emit** (`emit`): `client`, `method` (`POST`/`PUT`/`PATCH`), `url`, `status`, `headers` (merged over the client's own headers), `body_template` (re-shapes the extracted item before sending), and per-emit `retries`/`cooldown` overrides
- **EmitJob retry policy**: default 5 retries / 5000ms cooldown, retries on 5xx/429/408/network errors, dead-letters immediately on other 4xx, honors `Retry-After` (capped at 60s)
- **Tracking/observability**: `GET /emissions.json` and `GET /extractions.json` endpoints (ring-buffer backed, sized via top-level `emit.size`/`extraction.size`, default 100), summarized under `stats.json`
- **Dashboard views**: `Emissions` and `Extractions` screens in the monitoring Web UI
- **`paginated_actions` interaction**: verified — each paginated fan-out triggers its own independent extraction/emit

## Problem

`README.md` has no mention of `parser`/`emit` at all — no section, no Fields-table entries, and the Roadmap still lists the crawler as a future item rather than a shipped feature. `DOCKERHUB_DESCRIPTION.md`'s condensed feature list is similarly silent. Users configuring Navi have no discoverable path to structured data extraction/emission, retry tuning, or the emissions/extractions monitoring views without reading source or the internal `docs/agents/future/crawler/` design docs.

## Expected Behavior

`README.md` and `DOCKERHUB_DESCRIPTION.md` fully document the crawler feature as a shipped capability: what it does, how to configure it, and how to observe it — matching the depth already given to `paginated_actions` and the existing Web UI screens.

## Solution

- Add a "Data Extraction and Emission" section to `README.md`, with YAML config examples (reusing/adapting the worked examples from `docs/agents/future/crawler/flows.md`)
- Document `parser` (`type`: `regex`/`json_path`/`css`, `match`, `filter`, `fields`, fallback `field`/`attribute`/`trim`) and `emit` (`client`, `method`, `url`, `status`, `headers`, `body_template`, `retries`, `cooldown`) in the Configuration File Fields table
- Document the `EmitJob` default retry policy and how to override it per emit
- Document the `GET /emissions.json` and `GET /extractions.json` endpoints and their top-level `emit.size`/`extraction.size` config, and add the `Emissions`/`Extractions` screens to the Web UI screens list
- Update the Roadmap section to remove the crawler as a planned item and reflect it as implemented
- Cross-reference `docs/agents/future/crawler/flows.md` for worked examples
- Update `DOCKERHUB_DESCRIPTION.md`'s Key Features list to mention structured extraction/emission

## Benefits

Users can discover and configure the crawler feature entirely from public documentation, without needing to read source code or internal design docs.
