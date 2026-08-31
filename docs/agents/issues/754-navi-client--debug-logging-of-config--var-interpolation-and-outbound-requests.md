# Issue: navi-client: debug logging of config $VAR interpolation and outbound requests

## Description

Spun off from #753 (investigation into majora #1241). `navi-client` currently
has no logging infrastructure at all — only scattered `console.log`/
`console.error` calls and a lone `console.warn`, with no concept of a log
level. This issue adds a `debug` log level (ported from the engine's own
logging shape) and wires it into two diagnostic gaps: `$VAR`/`${VAR}`
interpolation during config parsing, and the outbound HTTP requests the
client actually sends.

## Problem

When a config file pushed via `navi-client -a config --file ...` doesn't behave
as expected downstream, there is currently no way to see, from logs:

- which `$VAR` / `${VAR}` placeholders `navi-client` resolved while parsing the
  file, and what they resolved to;
- what request `navi-client` actually sent over the wire.

The client has no logging infrastructure today — only scattered `console.log` /
`console.error` in `CliRunner.js` and a lone `console.warn` in
`EnvStringResolver.js`. There is no log level.

## Expected Behavior

With `LOG_LEVEL=debug` (or the `--log-level debug` CLI flag), a `navi-client`
run prints:

- one line per distinct `$VAR`/`${VAR}` name resolved per config file,
  reporting whether it was set and (if set) its value length + a short hash —
  never the raw value — plus a per-file summary (placeholder/resolved/missing
  counts);
- one line per outbound HTTP request (`config`, `engine-start`, `engine-stop`
  alike), with method, full URL, and request body — but never the
  `Authorization` header/bearer token, at any log level.

Without `debug`, behavior is unchanged from today except that the existing
diagnostic `console.warn`/`console.error` calls now route through the same
level-aware `Logger` (so `LOG_LEVEL=silent` suppresses them too); the CLI's
actual JSON result output is unaffected by the log level at any setting.

## Solution

### 1. Introduce a client log level

Port the *shape* of the engine's logging stack
(`source/lib/common/utils/logging/`) into `clients/node/lib/`, the same way
`EnvStringResolver.js` is already a self-contained client-side port of the
engine's equivalent — no dependency on `source/`:

- **`Logger`** — static facade (`Logger.debug/info/warn/error`).
- **`BaseLogger`** — level-filtering logic, same five levels as the engine
  (`debug`/`info`/`warn`/`error`/`silent`), defaulting to `LOG_LEVEL` env var
  (falls back to `info` when unset) — so `LOG_LEVEL=debug` behaves identically
  on client and server.
- **`ConsoleLogger`** — output sink.

`LoggerGroup` (the engine's fan-out layer) is intentionally **not** ported —
the client CLI only ever has one output sink (stdout/stderr), so fan-out has
no use case here.

Additionally, add a `--log-level <level>` CLI flag (kebab-case, matching this
package's existing `--base-url`/`--token` flag naming convention) that sets
the effective level, taking precedence over `LOG_LEVEL` when both are given —
useful for one-off debug runs without exporting an env var.

Route the existing `console.*` calls through the new `Logger` as follows
(full inventory — no other call sites exist):

| Call site | Today | Becomes |
| --- | --- | --- |
| `EnvStringResolver.js` — unresolved var | `console.warn` | `Logger.warn` |
| `CliRunner.js:29` — missing/invalid option | `console.error` | `Logger.error` |
| `CliRunner.js:37` — invalid JSON payload | `console.error` | `Logger.error` |
| `CliRunner.js:48` — dispatch/request failure | `console.error` | `Logger.error` |
| `CliRunner.js:45` — successful JSON result | `console.log` | **unchanged** |

`CliRunner.js:45` stays a raw `console.log` — it's the CLI's actual product
output (piped/parsed by callers), not a diagnostic log line, so it must never
be gated or reshaped by the log level.

The three `Logger.error` call sites mean `LOG_LEVEL=silent` suppresses their
printed message too, exactly matching the engine's own `silent` semantics
(`error` level < `silent` threshold). The process exit code (`1`) is
unaffected either way — only the printed message is suppressed.

### 2. Log interpolation (`ConfigFileParser` / `EnvStringResolver`)

When the level is `debug`, emit one line per **distinct** `$VAR` / `${VAR}`
variable name encountered while resolving a config file — deduped, not one
line per occurrence. A var referenced multiple times in the same file
resolves to the same value/status every time, so repeats add no information;
dedup keeps the log readable for configs that reuse a var throughout. Each
line reports:

- the variable name;
- whether it was set in the environment;
- if set: the resolved **value length** and a **value hash** (e.g. the first 12
  hex chars of its SHA-256) — never the raw value;
- if unset: marked explicitly (it fell back to `''`). Note this is already
  correctly disambiguated from "set but empty" by `EnvStringResolver`'s
  existing `resolved === undefined` check — a var set to `''` reports as
  "set, length 0," not "unset."

Plus a summary line per file: file path, placeholder count (occurrences,
not deduped), resolved count, missing count — counts stay per-occurrence
here since they answer "how much interpolation happened in this file," a
different question from the per-variable detail lines above.

For a multi-file CLI invocation (`--file`/`--json`/`--yaml`, possibly several,
grouped by namespace in `CliRunner.#configFromEntries`), each file gets its
own summary line and its own set of variable lines — never combined into one
line for the whole invocation.

### 3. Log outbound requests (`NaviApiClient`)

Log at the `NaviApiClient#post` choke point itself, not the config-file path
specifically — `post` is the single method behind all three actions
(`config`, `engine-start`, `engine-stop`), so logging there covers all of
them uniformly with no extra call-site wiring. When the level is `debug`, log
every HTTP request the client makes — at minimum `POST /api/config` — with
method, full URL, and the request **body** (the already-resolved config
JSON, or whichever body the given action sends).

**Never log request headers, at any level.** `NaviApiClient#post` sends an
`Authorization: Bearer <token>` header on every request — the bearer token
must never reach a log line, even redacted/truncated. The log payload is
built explicitly from `{ method, url, body }`; it must never be, or derive
from, the axios request/config object as a whole (which carries `headers`
and would leak the token if naively serialized).

### Out of scope

- Changing interpolation behaviour (an unset var still becomes `''` + a warning)
  — that decision belongs to #753.
- Server-side interpolation logging — separate issue.

### Why value length + hash, not the value

The resolved value can be a secret. Length + a stable hash is enough to answer
"did the same value that is configured server-side reach the parser?" and "was it
empty / whitespace / mangled?" without writing secrets into logs. The outbound
request body log in step 3 does contain resolved values, so it must be strictly
gated behind `debug`.

The same reasoning is stricter for the request's `Authorization` header: unlike
config values (which are business data an operator may legitimately need to
inspect under `debug`), the bearer token is pure access-control material with
no debugging value — so it's excluded outright, unconditionally, rather than
gated behind a log level.

## Benefits

- Makes config-push failures (env var interpolation mismatches, malformed
  requests) debuggable from logs alone, without reproducing locally.
- Shares `LOG_LEVEL` semantics with the engine, so operators use one mental
  model across client and server.
- Never exposes secret values or the bearer token, even under `debug` —
  safe to enable in shared/CI environments.
