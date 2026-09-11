# Merge and thread parameters through ResourceEnqueuer

Extend `ResourceEnqueuer#enqueue` to accept the string-or-object entries and an
optional target-level default parameter map, merge them, and use the new
`hasUnresolvedTokens` gate (from step 01) instead of `needsParams()`.

Concretely, change the signature to something like
`enqueue(entries, { parameters: targetParameters = {} } = {})`, where `entries`
is `Array<string | { name, parameters? }>` (the caller — `ApiEngineStartHandler`
in step 03 — has already validated the shape). For each entry:

1. Normalize to `{ name, parameters }`: a bare string becomes
   `{ name: entry, parameters: targetParameters }`; an object becomes
   `{ name: entry.name, parameters: { ...targetParameters, ...entry.parameters } }`
   (shallow merge, per-resource wins on key conflict).
2. Resolve the resource exactly as today (`#findResource`) — keep the
   `not_found` skip unchanged.
3. Keep the `disabled` check unchanged, evaluated before the token gate.
4. Replace `resource.resourceRequests.some(r => r.needsParams())` with
   `resource.resourceRequests.some(r => r.hasUnresolvedTokens(merged))`. On skip,
   push `{ name, reason: 'needs_params' }` **plus `parameters: merged`** when
   `merged` is non-empty (omit the key entirely when it's `{}`, so a plain
   name-only call keeps today's exact skip shape).
5. On success, enqueue
   `JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: merged })`
   for every request in the resource (replacing the hardcoded `parameters: {}`),
   and push `name` to `enqueued` once per entry (unchanged grain — a
   multi-request resource still contributes its name once; repeated entries with
   the same name push it multiple times, which is intended for batching).

`enqueueAll()` and `requestsNeedingNoParams()`/`ResourceRequestCollector` are
**not touched** — bulk enqueue (no `resources` list on a target) stays
param-free-only regardless of any target-level `parameters`.

Verify explicitly (not just by inspection) that calling `enqueue(names)` with no
second argument and every entry a bare string is byte-for-byte identical to
today's behavior — this is the crux of backward compatibility for this file.

## Files to Change

- `source/lib/utils/ResourceEnqueuer.js` — the changes above.
- `source/spec/lib/utils/ResourceEnqueuer_spec.js` — cover: existing
  bare-string-only calls behave identically (regression); a resource entry
  object with `parameters` satisfying its tokens enqueues with the merged
  params; a target-level default merges under a per-resource override
  (per-resource wins on conflicting keys); a resource entry still missing a
  required token after the merge is skipped as `needs_params` with the
  `parameters` echo present; a bare-string entry under a target-level default
  receives that default as-is; `disabled`/`not_found` still win over
  `needs_params` regardless of supplied parameters; extra parameter keys with no
  matching token are still threaded into the enqueued job's `parameters`;
  repeating the same resource name with different `parameters` enqueues two
  separate jobs and pushes the name twice into `enqueued`; `enqueueAll()` is
  unaffected by a target-level `parameters` argument (still param-free-only).
