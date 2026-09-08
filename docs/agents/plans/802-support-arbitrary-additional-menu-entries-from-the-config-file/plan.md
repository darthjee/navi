# Plan: Support arbitrary additional menu entries from the config file

Issue: [802-support-arbitrary-additional-menu-entries-from-the-config-file.md](../../issues/802-support-arbitrary-additional-menu-entries-from-the-config-file.md)

## Overview

IMPL-1 (#801) shipped the config-driven internal menu pipeline
(`config/menu.yml` → `MenuConfig.fromFile` → `GET /menu.json` → `MenuClient` →
`MenuMenu` dropdown) with Logs + Memory defaults, per-entry skip-and-warn
validation, and file-level fail-fast. This issue (IMPL-2) implements the
operator-facing semantics SPEC-2 (#796) settled and IMPL-1 deferred:
merge-with-defaults, a top-level `defaults: false` full-replace switch, an
effective per-entry `hidden`, file-order repositioning of a re-listed default,
first-wins de-duplication by `route`, and a scrolling dropdown panel. All the
resolution logic lands server-side in `MenuConfig`; `GET /menu.json` keeps its
exact response shape, so the frontend only gains a scroll style. The stock
`menu.yml` (npm copy and Docker copy) is trimmed to a commented template, and a
new operator guide documents the format.

## Agents involved

- [engine](engine.md) — `MenuConfig` / `MenuEntry` resolution logic, the packaged
  stock `source/config/menu.yml`, backend specs, and the `docs/agents/web-server.md`
  reference.
- [frontend](frontend.md) — scrolling dropdown panel, frontend specs, SPA rebuild,
  and the `docs/agents/frontend.md` reference.
- [docs](docs.md) — new operator-facing `docs/guides/navi/configuring-the-menu.md`
  guide and its index entry.
- [docker](docker.md) — the Docker-image stock `menu.yml` copy.

## Shared contracts

### `GET /menu.json` response — unchanged (engine → frontend)

Shape stays exactly as IMPL-1:

```json
{ "entries": [ { "route": "/logs", "text": "Logs" }, { "route": "/dashboard", "text": "Dashboard" } ] }
```

- `entries` is the **final resolved render list, in render order**. All of
  `defaults: false`, `hidden`, repositioning, and de-duplication are resolved
  inside `MenuConfig` at load time — never serialized, never sent to the client.
- `hidden` and `defaults` never appear in the response.
- The frontend renders the entries **verbatim and in order**; it must not cap,
  sort, de-duplicate, or otherwise reinterpret them. The only frontend change is
  a scrollable panel (`max-height` + `overflow-y: auto`) for long lists.
- `MenuHandler`, `MenuSerializer`, `Router`, and `MenuClient` are untouched.

### Menu configuration file schema (engine → docs, engine ↔ docker)

Settled in SPEC-2 (#796) / `docs/agents/future/menu-configuration.md`
"Operator-supplied entries". The authoritative rules `MenuConfig` implements and
the guide documents:

| Lever | Rule |
|---|---|
| **Merge** | Operator `entries` are appended after the shipped Logs/Memory defaults: defaults first (shipped order), then custom entries in file order. |
| **`defaults: false`** | Top-level boolean sibling of `entries`. `false` drops **both** shipped defaults; only operator entries render. It is the **only** way to empty the menu. A non-boolean value is ignored with a `Logger.warn` and treated as `true`. |
| **`entries: []`** | With `defaults` absent/`true`, still renders Logs + Memory (empty custom list, not a wipe). **Reverses IMPL-1**, where `entries: []` produced an empty menu. |
| **`hidden: true`** | On an entry whose `route` matches a known default (`/logs`, `/memory/status`): removes just that default; the `hidden` entry itself never renders. On a non-default `route`: dropped with a `Logger.warn` (no-op). |
| **Reposition** | A non-hidden custom entry whose `route` matches a known default pulls that default out of the default block and renders it at the custom entry's file position — **not duplicated**. Supplied `text` overrides the default label; omitted `text` keeps the default label (Logs / Memory), *not* the route. |
| **Duplicate `route`** | Evaluated over the merged render-order list: first occurrence wins; each later entry with the same `route` is dropped with `Logger.warn`, indices counting position in the merged list: `[menu] skipping duplicate entry at index 5: route "/dashboard" already defined at index 2`. |
| **Text collision** | A custom entry reusing a default's *text* on a different `route` is allowed, no warning — only `route` is an identity. |
| **No entry cap** | Any number of entries; the dropdown panel scrolls. Grouping, nested submenus, per-entry icons and an explicit `order` key stay out of scope. |

Unchanged from IMPL-1: absent / empty / whitespace-only / no-`entries` file →
`MenuConfig.DEFAULT_ENTRIES`; unparseable YAML or `entries` present but not a
list → `throw MenuConfigurationInvalid` (fail-fast); the malformed-individual-entry
`Logger.warn` keeps its existing raw `entries`-array index wording.

### Stock `menu.yml` template (engine ↔ docker)

Both `source/config/menu.yml` (shipped in the `navi-hey` npm package via
`package.json` `files: ["config", …]`) and
`dockerfiles/production_navi_hey/config/menu.yml` (copied into the image at
`/home/node/app/config/menu.yml`) are replaced with the **same** commented-out
example — no active `entries`. `MenuConfig.DEFAULT_ENTRIES` guarantees Logs +
Memory when the file has no active entries, so behaviour is unchanged. Keep both
files present as a copy-and-edit template. `NAVI_MENU` / `-m` / `--menu` /
`DEFAULT_MENU_FILE` are all unchanged.

## CI Checks

- `source`: `npm run lint && npm run report && npm run test` (CircleCI: `checks`,
  `jasmine`)
- `frontend`: `npm run lint && npm run report && npm run test` (CircleCI:
  `checks-frontend`, `jasmine-frontend`)
- `docs.md` / `docker.md` changes are docs/YAML only — no dedicated CI job.

## Notes

- Non-boolean top-level `defaults`: SPEC-2 does not pin the policy. This plan
  chooses **skip-and-warn, treat as `true`** — consistent with the menu being
  cosmetic and file-level fail-fast being reserved (per SPEC-1) for unparseable
  YAML / non-list `entries`.
- `docs/agents/future/menu-configuration.md` is **not** deleted here — that is
  CLEAN-1 (#807).
- `LinksDropdown` / `LinksMenu` and `GET /links.json` are explicitly out of
  scope; the scroll style is added only to the internal `MenuDropdown` panel.
