# Plan: navi-client: debug logging of config $VAR interpolation and outbound requests

Issue: [754-navi-client--debug-logging-of-config--var-interpolation-and-outbound-requests.md](../issues/754-navi-client--debug-logging-of-config--var-interpolation-and-outbound-requests.md)

## Overview

Port the *shape* of the engine's logging stack (`Logger`/`BaseLogger`/`ConsoleLogger`, no `LoggerGroup`) into `clients/node/lib/`, gated by a `LOG_LEVEL` env var and a new `--log-level` CLI flag (flag wins). Route the client's existing diagnostic `console.*` calls through it, then add two `debug`-only diagnostics: deduped per-variable `$VAR`/`${VAR}` interpolation logging (with a per-file summary) in the config-parsing path, and outbound-request logging (method, URL, body — never headers) at the shared `NaviApiClient#post` choke point.

## Agents involved

- [navi-client](navi-client.md)
- [docs](docs.md)

## Shared contracts

- **CLI flag**: `--log-level <level>` (no short form), one of `debug`/`info`/`warn`/`error`/`silent`. Takes precedence over the `LOG_LEVEL` env var when both are given.
- **Env var**: `LOG_LEVEL`, same five levels, defaults to `info` when neither the flag nor the env var is set — identical semantics to the engine's `BaseLogger`.
- **Debug output shape `docs` must describe accurately**:
  - Interpolation: one line per distinct variable name per config file (deduped across repeated occurrences within that file), reporting set/unset status and, when set, **value length + a short hash** — never the raw value. Plus one per-file summary line (placeholder/resolved/missing counts).
  - Outbound requests: one line per HTTP request (covers `config`, `engine-start`, `engine-stop` alike, logged once at `NaviApiClient#post`), with method, full URL, and body. The `Authorization` header/bearer token is **never** logged, at any level.

## Notes

- `docs/agents/client-node.md` (the contributor-facing architecture reference for this package) should also gain a short mention of the new logging module and `--log-level`/`LOG_LEVEL`, mirroring the existing "CLI usage" section's style. That file falls outside both `clients/node/` (the `navi-client` agent's scope) and the `docs` agent's documented scope (which explicitly excludes `docs/agents/*`) — the coordinating architect should make this small update directly during implementation rather than assigning it to either specialist.
