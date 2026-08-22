# docs Plan: Docs: document memory monitoring feature

Main plan: [plan.md](plan.md)

## Shared contracts

- Performs the rename `docs/guides/HOW_TO_USE_NAVI.md` → `docs/guides/how_to_use_navi.md` (step 3). `architect` depends on this exact new path landing first, to update its own two out-of-scope references in `.claude/agents/architect.md` and `.claude/agents/docs.md`.

## Steps

- [01 — Document `web.memory` config and `GET /memory/status.json` in README.md](docs/01-readme-memory-config-and-endpoint.md)
- [02 — Document the Memory status screen in README.md and DOCKERHUB_DESCRIPTION.md](docs/02-document-memory-status-screen.md)
- [03 — Rename HOW_TO_USE_NAVI.md and update references](docs/03-rename-how-to-use-navi.md)

## Notes

- No CI job lints markdown in this repo (`.circleci/config.yml`'s `lint-and-report` job only targets code paths) — no `## CI Checks` section applies.
- The parent feature issue (#682) and both dependency sub-issues (#684/PR #689, #685/PR #690) are already merged — nothing here is blocked.
