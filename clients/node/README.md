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
| `engineStart(payload = {})` | `POST /api/engine/start` |
| `engineStop()` | `POST /api/engine/stop` |

Every method returns a `Promise` resolving to the parsed JSON response body, and rejects with an `ApiRequestFailed` error (`statusCode`, `url`, `body`) when the request fails or the response status is `>= 400`.

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
| `--payload` | `-p` | Optional JSON request body (used by `config`/`engine-start`). |

```bash
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
  -p '{"namespace":"reports","resources":{"categories":[{"url":"/categories.json","status":200}]}}'

navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a engine-start \
  -p '{"targets":[{"namespace":"reports"}]}'
```

The CLI prints the JSON response body to stdout on success, or an error message to stderr and exits with status `1` on failure.

---

## Source & Documentation

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi)
