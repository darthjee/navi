# Docs Plan: Crawler: document parser and emit features in README and user docs

Main plan: [plan.md](plan.md)

## Overview

`README.md` currently has zero mentions of `parser`/`emit` — no dedicated section, no Fields-table rows, and the Roadmap still lists the crawler as a future item. Meanwhile the feature has fully shipped: three parser types (`regex`, `json_path`, `css`), a configurable `emit` (headers, body template, retry overrides), a dedicated `EmitJob` retry policy, and `/emissions.json`/`/extractions.json` tracking endpoints with matching dashboard screens. This plan brings `README.md` (and a short `DOCKERHUB_DESCRIPTION.md` bullet) up to date with all of it.

Reference material already in the repo (read, don't duplicate structure from, just source facts/examples):
- `docs/agents/future/crawler/flows.md` — worked YAML examples (Loot Studios catalog → Majora, regex standalone)
- `docs/agents/future/crawler/decisions.md` — decisions #7, #9, #11–#21 (retry policy specifics, header-merge behavior, body_template syntax, tracking/observability shape)
- `source/lib/services/builders/RegistriesBuilder.js:36-39` — the three registered parser type keys (`regex`, `json_path`, `css`)
- `source/lib/models/request/ResourceRequestEmit.js` — authoritative `emit` field list and JSDoc (`client`, `method`, `url`, `status`, `retries`, `cooldown`, `headers`, `body_template`)
- `source/lib/parsers/CssSelectorParser.js` — authoritative `css` parser field list (`match`, `filter` incl. `equals`/`equals_field`, `fields`, fallback `field`/`attribute`/`trim`)

## Steps

- [01 — Add the Data Extraction and Emission section](docs/01-add-data-extraction-and-emission-section.md)
- [02 — Document parser/emit fields in the Configuration File Fields table](docs/02-document-fields-table.md)
- [03 — Document retry policy, tracking endpoints, and dashboard screens](docs/03-document-retry-observability-and-dashboard.md)
- [04 — Update the Roadmap section](docs/04-update-roadmap.md)
- [05 — Update DOCKERHUB_DESCRIPTION.md](docs/05-update-dockerhub-description.md)

## CI Checks

None — no CI job in `.circleci/config.yml` lints or checks root-level Markdown files (`README.md`, `DOCKERHUB_DESCRIPTION.md`); all `lint-and-report` jobs target `source`, `frontend`, `clients/node`, `worker`, and `dev/*`.

## Notes

- Keep new README prose consistent with the existing `paginated_actions` section's depth and tone (`README.md:384-456`) — that's the closest existing analog for a multi-part, config-driven feature.
- The `assets` Fields-table rows (`README.md:210-214`) are the closest existing analog for documenting a nested-array config feature (`assets[].selector`, etc.) — follow the same `parent` / `parent[].field` row-naming convention for `parser`/`emit`.
- Do not touch `docs/agents/future/crawler/*.md` — those are internal design docs, already accurate; this plan only adds user-facing documentation.
