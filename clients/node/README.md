# navi-hey-client

Node.js client for [Navi](https://github.com/darthjee/navi)'s token-secured `/api/*` HTTP namespace.

Navi's `/api/*` namespace (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`) allows external, programmatic control of a running Navi instance. This package is a thin wrapper over that namespace — it does not replicate any config/resource logic client-side — exposing both a library and a CLI (`navi-client`), so callers don't have to hand-roll requests and bearer-token handling themselves.

---

## Installation

```bash
npm install navi-hey-client
```

## Library usage

```js
import { NaviClient } from 'navi-hey-client';

const client = new NaviClient({
  baseUrl: 'http://localhost:3000',
  token: process.env.NAVI_API_TOKEN,
});

// POST /api/config
await client.config({
  namespace: 'reports',
  clients: { default: { base_url: 'https://example.com' } },
  resources: { categories: [{ url: '/categories.json', status: 200 }] },
});

// POST /api/engine/start
await client.engineStart({
  targets: [{ namespace: 'reports', resources: ['categories'] }],
});

// POST /api/engine/stop
await client.engineStop();

// Read config straight from the same YAML/JSON files the engine reads,
// one POST /api/config call per distinct namespace found across the files
await client.configFromFiles(['./config/reports.yml', './config/billing.json']);
```

### `NaviClient`

| Constructor option | Description |
|---------------------|-------------|
| `baseUrl` | Base URL of the running Navi instance (no trailing slash required). |
| `token` | Bearer token matching the target instance's `web.api.token`. |
| `timeout` | Optional request timeout in milliseconds. Defaults to `5000`. |

| Method | Maps to |
|--------|---------|
| `config(payload)` | `POST /api/config` |
| `configFromJson(paths)` | `POST /api/config` (once per namespace) — parses one or more files as JSON, fanning out per distinct `namespace` found across them. |
| `configFromYaml(paths)` | `POST /api/config` (once per namespace) — same as above, forcing YAML parsing. |
| `configFromFiles(paths)` | `POST /api/config` (once per namespace) — same as above, auto-detecting JSON vs. YAML per file extension (`.json` vs. `.yml`/`.yaml`). |
| `engineStart(payload = {})` | `POST /api/engine/start` |
| `engineStop()` | `POST /api/engine/stop` |

`configFromJson`/`configFromYaml`/`configFromFiles` each accept a single path or an array of paths. Every file is read and parsed up front — no `include:` chain resolution, only `namespace`/`resources`/`clients` are extracted — and the call throws before sending any request if any file is missing or fails to parse. Files are grouped by `namespace` (defaulting to `'default'`) in order of first appearance, with same-namespace collisions resolved last-file-wins, and one `POST /api/config` request is issued **sequentially** per namespace group; the call resolves to an array of per-namespace results in that order. `${VAR}`/`$VAR` env references in the file content are resolved locally before sending.

Every method returns a `Promise` resolving to the parsed JSON response body (or, for the `configFrom*` methods, an array of them), and rejects with an `ApiRequestFailed` error (`statusCode`, `url`, `body`) when a request fails or the response status is `>= 400`.

See the main [Navi `/api` namespace documentation](https://github.com/darthjee/navi/blob/main/docs/agents/web-server.md#api-namespace) for the full request/response shape of each route.

## CLI usage

```bash
npx navi-client --base-url http://localhost:3000 --token $NAVI_API_TOKEN --action engine-stop
```

| Option | Short | Description |
|--------|-------|--------------|
| `--base-url` | `-b` | Base URL of the running Navi instance. Required. |
| `--token` | `-t` | Bearer token. Required. |
| `--action` | `-a` | One of `config`, `engine-start`, `engine-stop`. Required. |
| `--payload` | `-p` | Optional JSON request body (used by `config`/`engine-start`). Mutually exclusive with `--file`/`--json`/`--yaml`. |
| `--file <path>` | | `config` only. `configFromFiles` semantics (auto-detects JSON/YAML by extension). Repeatable. |
| `--json <path>` | | `config` only. `configFromJson` semantics (forces JSON parsing). Repeatable. |
| `--yaml <path>` | | `config` only. `configFromYaml` semantics (forces YAML parsing). Repeatable. |

```bash
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
  -p '{"namespace":"reports","resources":{"categories":[{"url":"/categories.json","status":200}]}}'

navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a engine-start \
  -p '{"targets":[{"namespace":"reports"}]}'

# --file/--json/--yaml are repeatable and combinable, merged in literal
# command-line order; mutually exclusive with --payload
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
  --file ./config/reports.yml --json ./config/billing.json --yaml ./config/extra.yaml
```

The CLI prints the JSON response body to stdout on success (or, for `config` with `--file`/`--json`/`--yaml`, the array of per-namespace response bodies), or an error message to stderr and exits with status `1` on failure.

---

## Source & Documentation

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi)
