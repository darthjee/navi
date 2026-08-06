# Plan: Allow client to read yaml directly

Issue: [632-allow-client-to-read-yaml-directly.md](../../issues/632-allow-client-to-read-yaml-directly.md)

## Overview

Add `configFromJson`/`configFromYaml`/`configFromFiles` methods (plus matching `--json`/`--yaml`/`--file` CLI flags) to `navi-hey-client`, so callers can point the client at the same single, non-`include:`-chained YAML/JSON config files the engine reads, parse out `namespace`/`resources`/`clients`, and fan out one sequential `POST /api/config` per distinct namespace — fully additive and backward compatible. In parallel, add a server-side regression test proving `POST /api/config` never resolves env vars, and document the new client surface.

## Agents involved

- [navi-client](navi-client.md)
- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

**1. `POST /api/config` payload (engine ↔ navi-client)** — the request body stays exactly `{ namespace: string, resources?: object, clients?: object }`; no API change. The engine guarantees — and the `engine` agent adds a regression test proving — that it performs **no** env var resolution on this payload. This is why env var substitution is a client-side-only concern: the client resolves `${VAR}`/`$VAR` locally, before sending, and the server must echo/store whatever literal string it receives.

**2. Client method & CLI surface (navi-client → docs)** — the `navi-client` agent produces exactly this public surface for `docs` to document:

- `NaviClient#configFromJson(paths)` / `#configFromYaml(paths)` / `#configFromFiles(paths)` — each accepts a single file path or an array of paths (JSON forced / YAML forced / auto-detected by extension, respectively). Each parses every given file up front — no `include:` chain following, `namespace`/`resources`/`clients` extracted, every other top-level key ignored. If **any** file is missing, unreadable, or fails to parse, the call throws before any request is sent. On success, files are grouped by `namespace` (default `'default'`) in order of first appearance, same-namespace collisions resolved last-file-wins, and one `POST /api/config` is issued **sequentially** per distinct namespace group, in that order. Resolves to an array of per-namespace results, in fan-out order.
- CLI flags `--file <path>`, `--json <path>`, `--yaml <path>` on the `config` action — each repeatable, freely combinable with each other in **literal command-line order**, and **mutually exclusive** with the existing `--payload`/`-p` (validation error if combined). The CLI prints the resulting array as JSON.
