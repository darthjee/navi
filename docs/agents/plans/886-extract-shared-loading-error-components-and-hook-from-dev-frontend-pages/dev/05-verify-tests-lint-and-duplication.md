# Verify tests, lint and duplication
From `dev/frontend/` run `yarn test`, `yarn lint` and `yarn report` (jscpd). All specs must pass, lint must be clean, and jscpd should show the four pages (and the new components/specs) with markedly fewer clones than before. Fix any react-hooks lint findings per the Notes in `dev.md`. Do not commit `dev/frontend/report/`.

## Files to Change
- None expected beyond fixes surfaced by the checks above
