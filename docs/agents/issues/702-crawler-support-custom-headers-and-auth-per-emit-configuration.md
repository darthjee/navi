# Issue: Crawler: support custom headers and auth per emit configuration

## Description

Part of #699 (Next Steps for Crawler Implementation). Tracked as gap #7 ("Custom headers per `emit`") in `docs/agents/future/crawler/gaps.md`.

`EmitJob` (#676) POSTs each extracted item to its external endpoint using only the sending `Client`'s configured headers (`Client#emit` -> `#emitRequest` sends `headers: this.headers`). The `emit` YAML block currently accepts `client`, `method`, `url`, `status`, `retries`, and `cooldown`, but has no way to declare headers of its own.

## Problem

- Endpoints that require a per-emit auth token, an explicit `Content-Type`, or a correlation / routing header cannot be targeted without defining a whole separate `client`, which duplicates `base_url` / `timeout` and does not scale when several emits share a client but need different tokens.
- Environment-based secrets (`$TOKEN`) already work for `clients.<name>.headers` because `ConfigIncluder#readYaml` runs the whole YAML file through `EnvStringResolver.resolve()` before parsing. `emit.headers` should inherit that behaviour with no extra machinery, but the option does not exist yet.

## Expected Behavior

- `emit.headers` -- an optional map of header name -> value -- is accepted in the YAML config and validated eagerly by `ResourceRequestEmit` (plain object; string-coercible values), alongside the existing emit keys.
- `$VAR` / `${VAR}` references inside those values resolve from `process.env` consistently with `clients.<name>.headers` -- i.e. at config-load time via the existing `EnvStringResolver` pass, with no new request-time resolver.
- On dispatch, `EmitJob` forwards the resolved `emit.headers` to `Client#emit`, which merges them over the client's default headers: keys present in `emit.headers` win, every other client header is still sent.
- With no `emit.headers` declared, behaviour is unchanged (client headers only).
- Docs updated: the config table in `docs/guides/navi/prerequisites.md` and the crawler emit documentation; gap #7 in `gaps.md` marked resolved.
- Specs cover `ResourceRequestEmit` validation + getter, `EmitJob` header forwarding, and `Client#emit` merge precedence.

## Solution

- `ResourceRequestEmit`: accept `headers` in the constructor (default `{}`), validate it is a plain object of string-coercible values, expose a `headers` getter, and include it in `fromObject`.
- `Client#emit` / `#emitRequest`: accept an optional per-call `headers` argument and build request options as `{ ...this.headers, ...perCallHeaders }`.
- `EmitJob#perform`: pass `this.#emit.headers` into `this.#getClient().emit(...)`.
- `EmitEnqueuer` needs no change -- it already forwards the whole `emit` object.

### Out of scope / follow-ups

- `emit.body_template` / custom JSON body wrapping the extracted item -- a larger templating concern, split out as #742.
- Computed / dynamic headers (HMAC payload signing, per-request correlation IDs) -- only static values with env-var references are supported here.

Suggested owner: `engine` specialist (`source/`).

## Benefits

- Endpoints needing per-emit auth or routing headers become reachable without cloning client definitions.
- Reuses the existing env-var resolution path, keeping secrets out of the config file.
- Closes gap #7 for the crawler feature.
