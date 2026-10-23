# Update agent docs

Bring the agent docs in line with the new image jobs. User-facing docs are left to #989, and `docs/agents/specs/release/` is left unchanged, except as noted below.

- `docs/agents/client-node.md` (release paragraph, ~line 65):
  - drop "The `build-and-release-client` and `update-description-client` job definitions remain ... not wired" and "the image jobs stay unwired until #987";
  - describe `release-darthjee-navi-hey-client`: after `release-navi-hey-client`, it releases the image tagged with the `clients/node/package.json` version when that tag is missing on Docker Hub;
  - describe `update-description-client`: it runs only when the image released.
- Check the other agent docs (`AGENTS.md`, `docs/agents/*.md`, `.claude/agents/docker.md`) for mentions of `build-and-release` or the client image pipeline, and update any found.
- `docs/agents/specs/release/gaps.md`: the "Docker Hub 'already published' check" gap is now decided. Mark it resolved (public Hub API via `curl`, no credentials), only if the gaps file tracks resolved items. Otherwise leave it for #980's cleanup.

## Files to Change
- `docs/agents/client-node.md` — release paragraph.
- Any other agent doc found mentioning the old image jobs.
