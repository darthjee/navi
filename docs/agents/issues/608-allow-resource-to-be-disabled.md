# Issue: Allow resource to be disabled

## Description
Add two new optional boolean keywords to individual resource-request entries under `resources:` — `enabled` and `disabled`. These let a specific request be toggled off without removing it from the configuration file.

```yaml
resources:
  home:
    - url: /
      status: 200
      enabled: true
      assets:
        - selector: script[src]
          attribute: src
        - selector: link[rel="stylesheet"]
          attribute: href
  categories:
    - url: /categories.json
      status: 200
      disabled: true
      actions:
        - resource: category_information
        - resource: products
          parameters:
            category_id: parsedBody.id
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
```

When a resource-request entry has `disabled: true` or `enabled: false`, it is skipped instead of being enqueued.

## Problem
Today the only way to stop Navi from crawling a given URL is to delete its entry from the config file entirely. This is inconvenient for temporarily turning off a flaky or noisy endpoint, staging a new resource before it goes live, or A/B-toggling parts of a crawl — the user has to edit and re-add the YAML block each time, risking typos or losing the original definition.

## Expected Behavior
- Each resource-request entry (an item in the array under a `resources.<name>` key) accepts two new optional boolean attributes: `enabled` and `disabled`.
- Default (neither given): the request behaves exactly as today — treated as enabled.
- `disabled: true` marks the request as disabled and always wins, regardless of what `enabled` says (e.g. `enabled: true, disabled: true` → disabled). Otherwise, `enabled: false` also marks it disabled.
- A disabled request is never enqueued, through **any** path: not at startup (`ApplicationInstance.enqueueFirstJobs()`), not via manual/API trigger (`EngineStartHandler` → `Application.enqueueResources()`), and not when reached as the target of another (enabled) resource's `actions` or `paginated_actions` chain.
- `enabled: true` (with no `disabled: true`), `disabled: false`, or omitting both keeps today's default behavior.

## Solution
Exact implementation still to be scoped with the engine specialist, but based on the current codebase the natural touch points are:
- `ResourceRequest` (`source/lib/models/request/ResourceRequest.js`) — parse the new `enabled`/`disabled` attributes and expose a single derived `disabled` (or `enabled`) boolean, with `disabled: true` taking precedence over any `enabled` value.
- `ResourceRequestCollector` (`source/lib/utils/ResourceRequestCollector.js`) — exclude disabled requests from `requestsNeedingNoParams()`, used by the startup auto-enqueue (`ApplicationInstance.enqueueFirstJobs()`).
- `ResourceEnqueuer` (`source/lib/utils/ResourceEnqueuer.js`) — already has a `skippedResources` pattern for `not_found`/`needs_params`; a `disabled` reason should be added there for on-demand/manual enqueue (triggered via the web/API `EngineStartHandler`), so a disabled resource can't be forced to run manually either.
- `ResourceRequestAction`/`ResourceRequestPaginatedAction` (`source/lib/models/request/`) — these enqueue a target resource's requests when triggered by a chained action from another (enabled) resource; they must also skip disabled requests, so a disabled resource can't be reached indirectly through chaining.
- Documentation:
  - `docs/HOW_TO_USE_NAVI.md` — add `enabled`/`disabled` rows to the field reference table (near the existing `client`/`status` rows, line ~100), and a short example entry showing `disabled: true` on one of the sample resource requests.
  - `docs/agents/flow/startup-and-config.md` — mention that disabled resource requests are excluded from the configuration structure example / startup flow.

## Benefits
- Lets users toggle a resource request off/on without deleting and re-adding its YAML definition.
- Reduces risk of config typos when temporarily disabling a noisy or broken endpoint.
- Makes staged rollout of new resources (defined but not yet crawled) straightforward.
