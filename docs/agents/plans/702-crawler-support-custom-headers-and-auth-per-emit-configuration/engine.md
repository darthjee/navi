# Engine Plan: Crawler: support custom headers and auth per emit configuration

Main plan: [plan.md](plan.md)

## Overview

Thread an optional per-emit `headers` map from YAML config through to the outgoing
HTTP request:

`emit.headers` (YAML) → `ResourceRequestEmit#headers` → `EmitJob#perform` →
`Client#emit` → merged into the axios request as `{ ...client.headers, ...emit.headers }`.

## Context

- `EmitJob` (`source/lib/jobs/EmitJob.js`) POSTs each extracted item via
  `this.#getClient().emit(method, url, item, status, logContext)`. It is the only
  library caller of `Client#emit`.
- `Client#emit` → `#emitRequest` (`source/lib/client/Client.js`) builds
  `options = { timeout, headers: this.headers, validateStatus }` and dispatches
  `axios.post/put/patch`. Per-emit headers must be merged into that `headers` object.
- `ResourceRequestEmit` (`source/lib/models/request/ResourceRequestEmit.js`) validates
  `client` / `method` / `url` / `status` / `retries` / `cooldown` eagerly in its
  constructor and exposes each via a getter; `fromObject` just forwards the raw object.
  It is built from `ResourceRequest.js:72` (`ResourceRequestEmit.fromObject(emit)`).
- Config-level env-var resolution already covers any new key: `ConfigIncluder#readYaml`
  (`source/lib/services/config/ConfigIncluder.js:123`) runs the entire YAML file text
  through `EnvStringResolver.resolve()` before `YAML.parse`. `emit.headers` values get
  `$VAR` / `${VAR}` resolution for free — no code needed for that part.
- Existing eager-validation exception pattern: `InvalidEmitMethod`,
  `InvalidEmitRetries`, `InvalidEmitCooldown` in `source/lib/exceptions/config/`, each
  extending `AppError`, each with a matching `*_spec.js`.
- `emit` config is not yet documented in `docs/guides/` (still a `future/crawler`
  feature); it is only described in `docs/agents/future/crawler/*.md`.

## Steps

- [01 — Add `headers` to ResourceRequestEmit](engine/01-resource-request-emit-headers.md)
- [02 — Thread per-call headers through Client#emit](engine/02-client-per-call-headers.md)
- [03 — Forward emit.headers from EmitJob](engine/03-emit-job-forward-headers.md)
- [04 — Update crawler docs](engine/04-docs.md)

## CI Checks

- `source`: `cd source; npm run coverage` (CI job: `jasmine`)
- `source`: `cd source; npm run lint` (CI job: `checks`)
- `source`: `cd source; npm run check_docs` (CI job: `checks` — jsdoc is `--pedantic`; keep new params documented)

## Notes

- **Merge semantics** (confirmed with issue author): merge, with `emit.headers` winning
  on key collision — `{ ...client.headers, ...emitHeaders }`. Never a full override.
- **Resolution timing** (confirmed): config-load time only, via the existing
  `EnvStringResolver` whole-file pass. Do **not** wire up `EnvResolver.resolveObject`
  or any request-time resolution.
- **Out of scope** (confirmed): `emit.body_template` (tracked separately as #742) and
  computed/dynamic headers (HMAC signing, per-request correlation IDs). Only static
  string values (optionally carrying `$VAR` references) are supported.
- `Client#emit` gets a new trailing optional `headers` parameter so the existing
  positional call sites and specs keep working unchanged.
- `Client#perform` / GET requests (`#requestUrl`) are intentionally left untouched —
  this issue is about `emit` only.
