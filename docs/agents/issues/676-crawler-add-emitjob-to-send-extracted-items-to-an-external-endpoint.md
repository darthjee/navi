# Issue: Crawler: add EmitJob to send extracted items to an external endpoint

## Context

Part of #671. Independent of the parser work — only needs the `emit` config from the config-schema sub-issue (#673/#679). Introduces the job that actually sends one extracted item to its configured destination. Wiring `ExtractionJob` → `EmitJob` (enqueuing one `EmitJob` per extracted item) is explicitly out of scope here — that belongs to #677.

## What needs to be done

- New `EmitJob` in `source/lib/jobs/`, following the existing `Job` subclass conventions (see `ResourceRequestJob`).
- Receives one extracted item plus the resource's `emit` config (`client`, `method`, `url`, optional `status`).
- Extend `Client` (`source/lib/services/Client.js`) with a new method supporting POST/PUT/PATCH + a JSON request body — today `Client` only performs GET (`#requestUrl` hardcodes `axios.get`). `EmitJob` calls this new method rather than building its own request, reusing the referenced client's `base_url`, `headers`, and `timeout`. (There is no separate "auth" concept in `Client` — auth is expressed via `headers`, e.g. `Authorization: Bearer ...`.)
- Supports **POST, PUT, PATCH** methods (already validated by `ResourceRequestEmit` at config-load time).
- Success/failure: treat any 2xx response as success by default; add an optional `status` field to the `emit` YAML config so a resource can pin an exact expected response code instead (mirrors `ResourceRequest.status`, but optional here). Any other status, or a network error, is a failure that triggers the retry path.
- Add `{:placeholder}` substitution to `ResourceRequestEmit.url`/`emit.url`, mirroring `ResourceRequest.resolveUrl`, so extracted-item field values can be substituted into the URL (not just sent in the body).
- Retry policy matches `ResourceRequestJob`: don't override `maxRetries` (inherits the base `Job` default of 3); `retry_cooldown` is already global via `WorkersConfig`/`JobRegistry` and needs no per-job wiring.
- Specs under `source/spec/lib/jobs/` covering success, each supported HTTP method, retry-on-failure (eventually succeeds and exhausts retries), the default-2xx success path, an explicit configured `status`, and URL placeholder substitution.
- New `Client` specs for the POST/PUT/PATCH method, and new `stubPost`/`stubPut`/`stubPatch` helpers in `source/spec/support/utils/AxiosUtils.js` (only `stubGet`/`stubGetRejection` exist today).
- Note for the frontend sub-issue: this adds a new job class needing registration in `frontend/src/constants/jobClasses.js` (out of scope here, tracked in the frontend sub-issue).

## Acceptance criteria

- [ ] `EmitJob` sends the item's payload as the request body to `emit.url` (with `{:placeholder}` substitution from the item's fields) via the referenced `client`
- [ ] POST, PUT, and PATCH are all supported
- [ ] `Client` gains a method supporting non-GET requests with a JSON body, reusing the client's `base_url`/`headers`/`timeout`
- [ ] A 2xx response is treated as success when `emit` doesn't specify a `status`; when it does, only that exact status counts as success
- [ ] On failure, `EmitJob` retries following the same `max-retries`/`retry_cooldown` pattern as `ResourceRequestJob`
- [ ] Specs cover a successful emit, each HTTP method, URL placeholder substitution, default-2xx vs explicit `status`, a failing emit that retries and eventually succeeds, and a failing emit that exhausts retries

## Related

Part of #671. Depends on the config-schema sub-issue (#673/#679). Independent of the parser sub-issues (#674/#681, #675) — can be built in parallel. Wiring `ExtractionJob` output into `EmitJob` enqueues is owned by #677, not this issue.
