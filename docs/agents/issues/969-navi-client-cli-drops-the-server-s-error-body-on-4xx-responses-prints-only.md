# Issue: navi-client: CLI drops the server's error body on 4xx responses (prints only {})

## Description
When a `/api/*` call fails, `navi-hey-client` throws an `ApiRequestFailed` whose message has only the URL and status code. The CLI prints only that message, so the reason the server gave never reaches the user. This came up while diagnosing darthjee/majora#1546. There, `POST /api/config` returned 400 because of a dangling action reference, and the CLI showed only:

```
Request to https://navi.example/api/config failed with status 400 {}
```

## Problem
- The server does send a reason. `ApiConfigHandler#badRequest` and `ApiEngineStartHandler` respond with `{ "error": "Resource \"game_common_items\" not found." }`.
- `NaviApiClient#post` (`clients/node/lib/NaviApiClient.js`) stores that body in `ApiRequestFailed.body`, but it is not part of the `message`.
- `CliRunner.run` (`clients/node/lib/CliRunner.js`) logs only `error.message`, so the body is lost. `LOG_LEVEL=debug` doesn't help. The trailing `{}` is the logger's empty metadata, not the response.
- `docs/guides/navi-client/reference.md` says the library and the CLI surface failures the same way, but in practice the CLI hides `body`.

## Expected Behavior
`ApiRequestFailed.message` includes the server's reason, so the CLI and library users see it without inspecting `body`:

```
Request to https://navi.example/api/config failed with status 400: Resource "game_common_items" not found.
```

Rules for the reason suffix:
- If `body.error` is a string, append `: <body.error>`.
- Otherwise, if the body is non-empty (an HTML page, other JSON, or plain text), append `: <body>`. Use `JSON.stringify` for objects and the raw text for strings, cut to about 200 characters with an ellipsis.
- If the body is empty (`undefined`, `null`, `''` or `{}`), keep today's message unchanged.

`statusCode`, `url` and `body` on `ApiRequestFailed` stay as they are. The network-failure path (no response) is unchanged.

## Solution
1. In `NaviApiClient#post`, build the `>= 400` message with a small private helper that turns `response.data` into the suffix described above. `CliRunner` needs no change, since it already prints `error.message` to stderr.
2. Specs in `clients/node/spec/lib/NaviApiClient_spec.js` covering: `{ error: '…' }`, another JSON object, an HTML/text body longer than the limit (truncated), and an empty body/`{}` (message unchanged). Add a `CliRunner_spec.js` case checking the reason reaches the logged error.
3. Docs: update the error-handling section of `docs/guides/navi-client/reference.md` (and `samples/error-handling.md` if needed) to say the message includes the server's reason.
4. Release a new `navi-hey-client` version (patch bump) through the normal release flow.

Owner: `navi-client` agent (`clients/node/`), with the `docs` agent handling the guide updates.

## Benefits
- Failed `/api/config` and `/api/engine/start` calls explain themselves in CI logs, with no need to reproduce the call by hand.
- Misconfigured base URLs (e.g. an SPA `index.html` fallback) become obvious from the truncated body.
- The CLI's output finally matches what the docs describe.
