# Issue: Add max page

## Description
Navi warms paginated resources by fanning out one request per page via `paginated_actions`: a caller resolves a total page count from its response and enqueues one downstream request per page against a target resource. For resources with many pages, only the first few are ever actually worth warming (e.g. the first page or two of a listing) — enqueueing every page is wasteful. This issue adds a `max_page` option that caps how many pages of a paginated resource are ever enqueued.

## Problem
Today, `paginated_actions[].pagination` always enqueues every page the caller resolves (via its `pages` expression), from page `1` (or `0` when `zero_indexed`) through the full count, with no way to cap it. A paginated resource with hundreds of pages gets every single one enqueued and warmed, even when only the first handful are ever actually hit by real traffic — wasting worker time and unnecessary load on the upstream API.

## Expected Behavior
- A `ResourceRequest` may declare an optional `max_page` field, at the same level as `url`/`status`/`disabled` — not inside the callers `paginated_actions[].pagination` block.
- The cap applies uniformly to every caller that fans out into this resource: it is a policy owned by the target resource itself, not overridable per-caller.
- Different list entries under the same resource name may each declare their own `max_page` independently — there is no requirement that all entries under one resource name agree.
- `max_page` counts pages, not page numbers: `max_page: 3` always means "the first 3 pages," whether `zero_indexed` is `true` (pages `0, 1, 2`) or `false` (pages `1, 2, 3`).
- Omitted, `null`, `0`, or any value that is not a positive integer (negative, non-integer float, `NaN`, non-numeric string, boolean, object/array) means unlimited (no cap) — the default. A present-but-invalid value additionally logs a warning (`LogRegistry.warn`); omitted/`null`/`0` log nothing, since those are expected, valid ways to say "no cap."

## Solution
- Add a `maxPage` field to `ResourceRequest`, parsed from the YAML key `max_page` (default `null`/unlimited), validating that anything other than a positive integer is treated as unlimited. Validation/sanitization happens **once, eagerly, inside `ResourceRequest`'s constructor** at config-load time — the same lifecycle as the codebase's other config validation — so a present-but-invalid value logs its warning exactly once per config entry, not on every pagination run. Downstream code (`PageRange`) always receives an already-sanitized `maxPage` (a positive integer or `null`) and does no validation of its own.
- Extract a new `PageRange` class (`source/lib/models/configs/PageRange.js`), constructed as `new PageRange({ count, zeroIndexed = false, maxPage = null })`, exposing `each(callback)` which invokes `callback(page)` once per page number in order — honoring `zeroIndexed` for the starting index and truncating to the first `maxPage` pages — without ever materializing the full, uncapped array just to slice it.
- Add a `zeroIndexed` getter to `PaginationConfig` (currently private-only), and retire `PaginationConfig#pageNumbers` in favor of `PageRange`.
- Update `ResourceRequestPaginatedAction#execute` to move page iteration inside the `resourceRequest` loop (since `max_page` is per-`resourceRequest`), constructing one `PageRange` per `resourceRequest` from the caller's resolved `count`/`zeroIndexed` and that `resourceRequest`'s own `maxPage`.
- Update docs: `docs/guides/navi/prerequisites.md` (new `max_page` row in the `ResourceRequest` fields table, after `disabled`), `docs/guides/navi/paginated-actions.md` (new "Capping pages with `max_page`" section with a worked example), and `README.md` (mirrored additions to its own duplicate fields table and "Paginated Actions" section, since it carries a separate copy of this content).

## Benefits
- Lets Navi warm only the pages of a paginated resource that are actually worth warming, instead of unconditionally fanning out to every page an API reports.
- Reduces unnecessary load on upstream APIs and wasted worker time for large paginated resources.
- The cap is owned by the resource being paginated, so it is enforced consistently no matter which caller triggers pagination against it — no risk of one caller forgetting to set a sane limit.
