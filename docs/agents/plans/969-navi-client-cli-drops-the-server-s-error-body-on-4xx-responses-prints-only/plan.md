# Plan: navi-client: CLI drops the server's error body on 4xx responses (prints only {})

Issue: [969-navi-client-cli-drops-the-server-s-error-body-on-4xx-responses-prints-only.md](../../issues/969-navi-client-cli-drops-the-server-s-error-body-on-4xx-responses-prints-only.md)

## Overview
`NaviApiClient#post` will add the server's reason to the `ApiRequestFailed` message for every response with status `>= 400`. The reason is `body.error` when that is a string, otherwise the raw body cut to about 200 characters, and nothing when the body is empty. The CLI already prints `error.message` to stderr, so it shows the reason with no change of its own. The `statusCode`, `url` and `body` fields stay as they are. The user-facing docs are updated to describe the new message.

## Agents involved

- [navi-client](navi-client.md)
- [docs](docs.md)

## Shared contracts

`ApiRequestFailed.message` for an HTTP response with status `>= 400`:

| Response body (`response.data`) | Message |
|---|---|
| object with a string `error` | `Request to <url> failed with status <status>: <body.error>` |
| other non-empty object/array | `Request to <url> failed with status <status>: <JSON.stringify(body)>`, cut to 200 chars + `…` |
| non-empty string (e.g. HTML) | `Request to <url> failed with status <status>: <string>`, cut to 200 chars + `…` |
| `undefined`, `null`, `''`, `{}` | `Request to <url> failed with status <status>` (unchanged) |

- Only the reason part (after `": "`) is truncated, never `body.error`.
- `ApiRequestFailed.statusCode`, `.url` and `.body` are unchanged.
- The network-failure message (`Request to <url> failed: <error.message>`) is unchanged.

Example: `Request to https://navi.example/api/config failed with status 400: Resource "game_common_items" not found.`
