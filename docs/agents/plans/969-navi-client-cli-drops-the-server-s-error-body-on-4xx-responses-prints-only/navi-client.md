# Navi-client Plan: navi-client: CLI drops the server's error body on 4xx responses (prints only {})

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the `ApiRequestFailed.message` format defined in [plan.md](plan.md#shared-contracts):
- `: <body.error>` when `body.error` is a string;
- otherwise `: <body>` (`JSON.stringify` for objects/arrays, raw for strings), cut to 200 chars + `…`;
- no suffix for `undefined` / `null` / `''` / `{}`.

`statusCode`, `url` and `body` stay the same. The network-failure path is unchanged.

## Implementation Steps

### Step 1 — Add the server's reason to the error message
In `clients/node/lib/NaviApiClient.js`, add a private helper (e.g. `#failureReason(data)`) that returns the suffix described above, or `''` when there is nothing to report. Use it in the `>= 400` branch of `#post`:
`` `Request to ${url} failed with status ${response.status}${this.#failureReason(response.data)}` ``. Keep the 200-char limit as a named constant at module scope, and update the JSDoc `@throws` line. `CliRunner` needs no change, since it already calls `Logger.error(error.message)`.

### Step 2 — Specs
- `clients/node/spec/lib/NaviApiClient_spec.js`, inside `describe('when the response status is >= 400')`: add one example per row of the contract. Cover `{ error: 'Resource "x" not found.' }` (message ends with `: Resource "x" not found.`), another JSON object (`{ foo: 'bar' }` → `: {"foo":"bar"}`), an HTML/text string longer than 200 chars (truncated, ends with `…`), and an empty body / `{}` / `''` (message is exactly `Request to … failed with status 400`). Keep the existing `statusCode`/`url`/`body` example.
- `clients/node/spec/lib/CliRunner_spec.js`: add a case where the client call rejects with an `ApiRequestFailed` carrying the new-style message. Check that `Logger.error` is called with it and the exit code is `1`, so the CLI keeps surfacing the message.

## Files to Change
- `clients/node/lib/NaviApiClient.js` — reason suffix helper; new `>= 400` message.
- `clients/node/spec/lib/NaviApiClient_spec.js` — message examples per body shape.
- `clients/node/spec/lib/CliRunner_spec.js` — check the CLI prints the API failure message.

## CI Checks
- `clients/node`: `npm test` (CI job: `jasmine-client`)
- `clients/node`: `npm run lint` (CI job: `checks-client`)

## Notes
- Do not change `clients/node/package.json`'s version by hand. The release goes through `scripts/bump_version.sh client` (patch) in the usual separate "Bump version" step, not in this PR.
- Library users who match on the exact old message will see a longer one. That's acceptable for a patch-level change; the structured fields stay the same.
