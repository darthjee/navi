# Bump the client to 0.2.4
Run `scripts/bump_version.sh client 0.2.4` to set `clients/node/package.json` to `0.2.4` and update the README's **Client Current Version** / **Client Next Version** badges. Those are the two places `scripts/check_client_tag_version.sh` checks against the `client-0.2.4` tag. Leave the existing `client-0.2.3` tag alone, since 0.2.3 was never published. Check whether `clients/node/README.md` mentions a version that should also be updated.

## Files to Change
- `clients/node/package.json` — `version` `0.2.3` → `0.2.4`.
- `README.md` — Client Current Version `0.2.4`, Client Next Version `0.2.5`.
