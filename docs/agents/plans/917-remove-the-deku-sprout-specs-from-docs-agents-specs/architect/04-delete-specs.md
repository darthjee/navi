# Delete the specs and verify no links remain

Delete `docs/agents/specs/deku-sprout.md` and the whole `docs/agents/specs/deku-sprout/` folder (`decisions.md`, `migration.md`, `overview.md`, `package.md`, `release-flow.md`, `rollout.md`).

Keep `docs/agents/specs/` and its `crawler` specs. Keep the `### Specs` section and the `Specs` row in `AGENTS.md`. The `Specs` row's "(e.g. the crawler feature)" example is still accurate.

Then check for leftover references:

```bash
grep -rn "specs/deku-sprout" --exclude-dir=node_modules . | grep -v "docs/agents/issues/\|docs/agents/plans/"
```

This must print nothing. Also check that nothing links to `specs/deku-sprout` through a relative path such as `(deku-sprout.md)` from inside `docs/agents/specs/`.

## Files to Change
- `docs/agents/specs/deku-sprout.md`: delete
- `docs/agents/specs/deku-sprout/`: delete (all 6 files)
