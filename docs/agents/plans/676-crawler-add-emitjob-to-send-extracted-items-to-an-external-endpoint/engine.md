# Engine Plan: Crawler: add EmitJob to send extracted items to an external endpoint

Main plan: [plan.md](plan.md)

## Overview

`ResourceRequestEmit` (`source/lib/models/request/ResourceRequestEmit.js`) already parses the `emit` YAML section (`client`, `method`, `url`, method validated as POST/PUT/PATCH) as of #673/#679, but nothing consumes it yet. This plan:

1. Extends `ResourceRequestEmit` with an optional `status` field and `{:placeholder}` URL substitution (mirroring `ResourceRequest`).
2. Extends `Client` with a new method that performs POST/PUT/PATCH with a JSON body, reusing `base_url`/`headers`/`timeout`, and owns the "2xx by default, else exact match" success logic (mirroring how `Client` already owns exact-status matching for GET via `#requestUrl`).
3. Adds `EmitJob`, a new `Job` subclass following `ResourceRequestJob`'s conventions, and registers it in `ApplicationInstance#initRegistries`.
4. Adds the spec coverage and test-support helpers (`AxiosUtils.stubPost/stubPut/stubPatch`, factories) the issue asks for.

`EmitJob`'s constructor accepts a single extracted item (a plain object, one element of the array returned by a parser's `extract()`) plus a `ResourceRequestEmit` instance and the client registry — it does not integrate with `ExtractionJob` (#677 owns that wiring).

## Steps

- [01 — Extend ResourceRequestEmit with status and resolveUrl](engine/01-extend-resource-request-emit.md)
- [02 — Extend Client with a POST/PUT/PATCH JSON method](engine/02-extend-client.md)
- [03 — Add EmitJob](engine/03-add-emit-job.md)
- [04 — Register EmitJob in ApplicationInstance](engine/04-register-emit-job.md)
- [05 — Add test-support helpers](engine/05-add-test-support.md)
- [06 — Add Client specs for the new method](engine/06-client-specs.md)
- [07 — Add EmitJob specs](engine/07-emit-job-specs.md)

## CI Checks

- `source`: `npm test` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- No direct precedent exists for "success = any 2xx by default, else exact match against a configured status" — today `Client#requestUrl` always compares to an exact `expectedStatus` (required on `ResourceRequest`). Step 02 introduces this as new logic, kept inside `Client` so it stays the single owner of status-matching (consistent with `Client.perform`/`performUrl` already owning it for GET).
- The issue asks for three distinct stub helpers (`stubPost`/`stubPut`/`stubPatch`), not one generic `stubRequest` — this implies `Client`'s new method should dispatch to `axios.post`/`axios.put`/`axios.patch` directly (one call site per verb), not a single `axios.request({ method, ... })` call. Step 02/05 follow this.
- `ResourceRequestEmit.status` is optional and unvalidated (plain assignment, like `ResourceRequest.status`) — no new exception class needed, unlike `method`/`url` which already have `InvalidEmitMethod`/`MissingEmitUrl`.
- Registering `EmitJob` in the `JobFactory` (Step 04) is in scope; having anything actually enqueue an `'Emit'` job (i.e. `ExtractionJob` calling `jobRegistry.enqueue('Emit', ...)`) is explicitly out of scope — that is #677.
- Frontend registration of the new job class in `frontend/src/constants/jobClasses.js` is explicitly out of scope (separate frontend sub-issue, per the issue body) — no frontend step in this plan.
