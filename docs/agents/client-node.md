# Client (Node)

`clients/node/` publishes `navi-hey-client`, a thin Node.js wrapper (library + CLI) over a running Navi instance's token-secured `/api/*` HTTP namespace: `POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`. See [Web Server](web-server.md#api-namespace) for the full request/response shape of each route — this package performs no client-side config/resource logic, it only forwards calls with the `Authorization: Bearer <token>` header handled internally.

## Package layout

```
clients/node/
├── package.json          # name: navi-hey-client; main: client.js; bin: { navi-client: bin/navi-client.js }
├── client.js              # library entrypoint: NaviClient
├── lib/
│   ├── NaviApiClient.js   # internal HTTP helper (axios POST + status handling)
│   ├── CliArgumentsParser.js
│   ├── CliRunner.js
│   └── exceptions/
│       └── ApiRequestFailed.js
├── bin/
│   └── navi-client.js     # CLI entrypoint (shebang, thin — delegates to lib/)
├── spec/                  # Jasmine specs mirroring client.js/lib/
├── eslint.config.mjs
└── README.md               # npm-facing readme (install/usage docs)
```

## Library API

`NaviClient` is constructed with `{ baseUrl, token, timeout = 5000 }` and exposes:

| Method | Maps to |
|--------|---------|
| `config(payload)` | `POST /api/config` |
| `engineStart(payload = {})` | `POST /api/engine/start` |
| `engineStop()` | `POST /api/engine/stop` |

Every method returns a `Promise` resolving to the parsed JSON response body, and rejects with `ApiRequestFailed` (`statusCode`, `url`, `body`) when the request fails or the response status is `>= 400`. `NaviApiClient` (`lib/NaviApiClient.js`) is the internal implementation detail performing the actual `axios.post` call — consumers should use `NaviClient` directly.

## CLI usage

The published `navi-client` command (`bin/navi-client.js`) parses `--base-url`/`-b`, `--token`/`-t`, `--action`/`-a` (`config`, `engine-start`, or `engine-stop`), and an optional `--payload`/`-p` JSON string, then delegates to `CliRunner.run` (`lib/CliRunner.js`), which builds a `NaviClient` and dispatches to the matching method. The result is printed as JSON to stdout on success; on failure, the error message goes to stderr and the process exits with status `1`.

## Testing

Same stack and conventions as `source/`: Jasmine specs under `spec/`, mirroring `client.js`/`lib/`'s tree, c8 for coverage, ESLint (`standard`-based config, no React plugins), and JSCPD for duplication analysis. Jasmine's own config-based spec discovery (`spec/support/jasmine.json`, loaded via `jasmine --config=...`) is used instead of a shell-expanded `spec/**/*.js` glob, so nested spec files are always discovered regardless of the invoking shell's globbing support.

```bash
cd clients/node
yarn install
yarn coverage   # tests + c8 coverage
yarn lint       # ESLint
yarn report     # JSCPD duplication report
```

## CI jobs

`.circleci/config.yml` runs two jobs for this package, mirroring the `jasmine-dev`/`checks-dev` pattern used for `dev/app/` (minus the `dev/app/lib/common` copy step, which doesn't apply here):

- `jasmine-client`: installs dependencies and runs `npm run coverage`, uploading partial coverage to Codacy.
- `checks-client`: installs dependencies and runs `npm run lint` and `npm run report`.

Both are wired into the `test-and-release` workflow and into `coverage-final`'s `requires` list. Publishing/tagging `navi-hey-client` to npm is **out of scope** for now — there is no `npm-publish-client` job yet; `clients/node/` is not part of `npm-publish`'s or `check-version-tag`'s `requires`/scope. A future issue will need to define a tagging scheme (e.g. a `client-X.Y.Z` prefix) and a corresponding publish job before the package can be released.

## Versioning

`scripts/bump_version.sh` supports `bump_version.sh [app|client] [version]` — the target defaults to `app` (unchanged behavior) and the version, when omitted, auto-increments the target's current patch version. The `client` target bumps `clients/node/package.json`'s version and the **Client Current Version** line in the root `README.md` (mirroring the app's Current Version/Next Release badge style). Never edit `clients/node/package.json`'s version by hand — always go through `bump_version.sh`.
