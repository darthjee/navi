# Engine Plan: Docs: module-level README indexes + move the config schema out of README (token efficiency)

Main plan: [plan.md](plan.md)

## Shared contracts

- Create **`source/lib/README.md`** — a terse index of the immediate children of
  `source/lib/` only, one line each, plus a "See also" link to
  `../../docs/agents/architecture/source-layout.md`. No recursion into nested dirs.
- Trim the `## Configuration File` `### Structure` + `### Fields` block in
  **`source/README.md`** (the `navi-hey` npm package readme) to the replacement blurb + the
  **absolute** URL
  `https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md`
  (npm's rendered readme can't resolve relative links). This deletes the stale copy rather
  than updating it. Leave `source/README.md`'s `## Resource Chaining` / `## Paginated
  Actions` sections alone.
- The canonical guide `docs/guides/navi/configuration-schema.md` is created by `docs`; the
  URL above is stable regardless of ordering.
- `architect` adds the reverse link from `docs/agents/architecture/source-layout.md` back
  to `source/lib/README.md` — not this agent.

## Implementation Steps

### Step 1 — Create `source/lib/README.md`

One line per immediate child of `source/lib/`. Current children and suggested descriptions
(refine against the code; keep each to one line):

- `client/` — `Client.js`: Axios-based HTTP executor for URL-template and absolute-URL requests.
- `common/` — utilities/base classes shared with `dev/app/` (`exceptions/`, `server/`, `utils/` incl. `logging/`, `EnvResolver`).
- `enqueuers/` — push jobs into `deku-swarm`'s `JobRegistry` (`ActionsEnqueuer`, `PaginatedActionsEnqueuer`, `AssetRequestEnqueuer`).
- `exceptions/` — custom error hierarchy under `AppError`; sub-domains `config/`, `request/`, `registry/`, `http/`.
- `jobs/` — concrete `Job` subclasses (`ResourceRequestJob`, `ActionProcessingJob`, `PaginatedActionProcessingJob`, `HtmlParseJob`, `AssetDownloadJob`).
- `models/` — YAML-config → typed instances (`configs/`, `request/`, `response/`); entry point `Config.fromFile()`.
- `parsers/` — response extraction strategies: `RegexParser`, `JsonPathParser`, `CssSelectorParser` (+ their sub-implementation folders).
- `registry/` — named-lookup collections (`ResourceRegistry`, `ClientRegistry`, `LogRegistry`, …); `instances/` singletons, `namespace/` primitives.
- `serializers/` — plain-object views of domain models for the web server's JSON responses.
- `server/` — Express web server: `Router`, `RouteRegister`, `HandlerConfig`, `handlers/` (+ `handlers/engine/`, `handlers/jobs/`).
- `services/` — business logic / I/O: `Application`, `ApplicationInstance`, `Client`, `ConfigLoader`, `ConfigParser`, `ArgumentsParser`.
- `utils/` — low-level helpers with no domain knowledge: `HtmlParser`, `ResourceRequestCollector`, `ResourceEnqueuer`, `generators/`.

End with:

```markdown
## See also

[`docs/agents/architecture/source-layout.md`](../../docs/agents/architecture/source-layout.md) — the full narrative breakdown of `source/lib/`.
```

Keep it lean — this is an internal navigation aid, not the package readme.

### Step 2 — Trim the schema block in `source/README.md`

Replace the `## Configuration File` section's `### Structure` and `### Fields` subsections
with:

> ## Configuration File
>
> Navi is configured via a YAML file that defines HTTP clients, resources, and the worker
> pool size. See the [configuration schema](https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md)
> for the full field-by-field reference.

Do not keep a YAML skeleton here. Leave the following `## Resource Chaining`,
`## Paginated Actions`, `## Docker`, `## Source & Documentation` sections unchanged.

## Files to Change

- `source/lib/README.md` — **new**: one-line-per-child index of `source/lib/`, "See also" →
  `../../docs/agents/architecture/source-layout.md`
- `source/README.md` — trim `## Configuration File` `### Structure` + `### Fields` to blurb
  + absolute link; leave the rest of the file intact

## CI Checks

- `source`: `checks` job runs `scripts/ci.sh lint-and-report source` (ESLint + JSCPD).
  Confirm `source/eslint.config.mjs` targets `.js` only so `source/lib/README.md` is not
  linted; if it has a broad `files` glob, add `**/*.md` to `ignores`. `jasmine` is
  unaffected (no `.js` touched).

## Notes

- `source/README.md` is published as the `navi-hey` npm package readme — that's why the
  link must be an absolute GitHub URL, not relative.
- Immediate children only in `source/lib/README.md`; do not document
  `source/lib/models/**`, `source/lib/exceptions/config/**`, etc. — those belong to
  `docs/agents/architecture/source-layout.md`, which the index links to.
