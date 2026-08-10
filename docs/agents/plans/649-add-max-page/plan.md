# Plan: Add max page

Issue: [649-add-max-page.md](../../issues/649-add-max-page.md)

## Overview

Add an optional `max_page` field to `ResourceRequest`, capping how many pages of a resource ever get enqueued when it's the target of another resource's `paginated_actions` — a limit owned by the target resource itself, applying uniformly regardless of which caller triggers pagination against it. The iteration itself moves into a new `PageRange` class that replaces `PaginationConfig#pageNumbers`, so an uncapped page list is never materialized just to be truncated. Docs (`README.md`, `docs/guides/navi/prerequisites.md`, `docs/guides/navi/paginated-actions.md`) get a matching write-up.

## Agents involved

- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

**`max_page`** — new optional YAML key on a `ResourceRequest` list entry, at the same level as `url`/`status`/`disabled`/`enabled` (not inside a `paginated_actions[].pagination` block):

- Internal field name: `maxPage` (camelCase), exposed as a getter on `ResourceRequest`.
- Semantics: caps how many pages of *this* resource are ever enqueued when it's the target of another resource's `paginated_actions`. The cap is owned by the target resource and applies to **every** caller — a caller cannot override or bypass it. Different list entries under the same resource name may each set their own `max_page` independently.
- Counts pages, not page numbers: `max_page: 3` always means "the first 3 pages," whether the caller's pagination is `zero_indexed: true` (pages `0, 1, 2`) or `false` (pages `1, 2, 3`).
- Valid values: any positive integer. Omitted, `null`, `0`, or anything else that isn't a positive integer (negative numbers, non-integer floats, `NaN`, non-numeric strings, booleans, objects/arrays) means **unlimited** (no cap) — the default.
- A present-but-invalid value additionally logs one `LogRegistry.warn` at config-load time (inside `ResourceRequest`'s constructor); omitted/`null`/`0` log nothing, since those are the expected, valid ways to say "no cap."

This exact field name, placement, and behavior is what `docs` must document, and what `engine` must implement — the two must stay in lockstep since `docs`' examples (extending the existing `categories`/`products_page` example with `max_page: 2`) are worked examples of `engine`'s actual behavior, not independent prose.
