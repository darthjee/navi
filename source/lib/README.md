# `source/lib/` index

One line per immediate child. For the full narrative breakdown, follow the "See also" link.

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

## See also

[`docs/agents/architecture/source-layout.md`](../../docs/agents/architecture/source-layout.md) — the full narrative breakdown of `source/lib/`.
