# Refactor ExtractionEmitFlow_spec.js
`ExtractionEmitFlow_spec.js` (17 clones, 176 duplicated lines) has two end-to-end `describe` blocks. In the first, four sibling scenarios (Loot Studios, Regex standalone, Disabled emit, Only-actions) each build a `ResourceRequest` with the same `lootstudios` client, create `new ResourceRequestJob({ id: 'top', resourceRequest, parameters: {}, clients })`, stub `AxiosUtils.stubGet`/`stubPost`, and then walk "perform → find enqueued `ExtractionJob` → perform → collect `EmitJob`s → perform each". The second block (paginated_actions, scenarios A/B) repeats the `ResourceRequest` construction with `status: 200`, `clientName: 'lootstudios'`, `namespace: 'default'` and the same "run every enqueued job of a class" loops.

- Add small local helpers (or a `support/utils/` helper if reusable) such as `buildTopJob(resourceRequestAttributes, body)` (builds the `ResourceRequest` with the shared defaults + the `ResourceRequestJob` + stubs), `enqueuedJobs(klass)` (the existing `enqueued` helper exists only in the second block — hoist it to file level and reuse), and `performAll(jobs)` for the `for (const job of ...) await job.perform(logContext)` loops.
- Extract the "perform top job → run its ExtractionJob → return the enqueued EmitJobs" walk into one helper and reuse it in the Loot Studios, Regex standalone and Disabled emit scenarios.
- Extract the shared `regex` `postid-(\d+)` parser + `rawBody` fixture used by the "Regex standalone" and "Disabled emit" scenarios into a single const (only `emit.disabled` differs) — possibly parameterised.
- Extract the repeated `axios.post` `toHaveBeenCalledWith(url, body, jasmine.anything())` expectations into a small `expectEmitted(url, body)` helper.
- Keep the docblocks describing the end-to-end scope; all scenarios keep their exact assertions (including the `Scenario B` before/after count checks). Prefer readability: the helpers must not hide what each scenario asserts.

## Files to Change
- `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` — dedupe as above
- `source/spec/support/utils/` — only if a helper is generic enough to be shared (e.g. an end-to-end flow helper); otherwise keep it local
