# Docs Plan: navi-client: CLI drops the server's error body on 4xx responses (prints only {})

Main plan: [plan.md](plan.md)

## Shared contracts

Document the `ApiRequestFailed.message` format from [plan.md](plan.md#shared-contracts). For responses with status `>= 400`, the message ends with `: <reason>`. The reason is `body.error` when the server returned `{ error }`, otherwise the response body cut to 200 characters. There is no reason suffix when the body is empty. `statusCode`/`url`/`body` are unchanged.

## Implementation Steps

### Step 1 — Describe the server's reason in the error docs
- `docs/guides/navi-client/reference.md`, "Error handling": after the field table, explain that the message includes the server's reason (same rules as above). Add an example CLI stderr line, e.g. `Request to https://navi.example/api/config failed with status 400: Resource "game_common_items" not found.`
- `docs/guides/navi-client/samples/error-handling.md`: in the CLI paragraph (and "What happens" if relevant), mention that stderr now includes the server's reason.
- `clients/node/README.md` (~L77): add a short clause to the error sentence saying the message includes the server's reason.

## Files to Change
- `docs/guides/navi-client/reference.md` — reason-in-message rules and example.
- `docs/guides/navi-client/samples/error-handling.md` — CLI stderr now shows the reason.
- `clients/node/README.md` — one-line note on the richer message.

## Notes
- No version numbers change in these docs. The client version/README badge is updated later by `bump_version.sh client`.
