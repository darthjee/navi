# Migrate `future/` to `specs/`
Create `docs/agents/specs/` by moving the only existing content of `docs/agents/future/`, `crawler.md` and the `crawler/` folder, with `git mv` so the history follows, and remove the now empty `docs/agents/future/`. Move the hub and its folder together: the relative links inside the crawler docs (`crawler/overview.md`, etc.) keep working unchanged, and no content edit is needed.

## Files to Change
- `docs/agents/future/crawler.md` → `docs/agents/specs/crawler.md` (`git mv`)
- `docs/agents/future/crawler/` → `docs/agents/specs/crawler/` (`git mv`: `decisions.md`, `flows.md`, `gaps.md`, `overview.md`, `reference-loot-studios.md`, `scope.md`)
- `docs/agents/future/` — removed
