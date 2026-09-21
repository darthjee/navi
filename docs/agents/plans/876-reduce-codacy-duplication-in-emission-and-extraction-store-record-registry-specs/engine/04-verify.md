# Verify spec count, lint and coverage

From `source/`:

- `yarn test` — all specs pass and the reported spec count equals the baseline recorded in step 01
- `yarn lint` — no new ESLint findings in `lib` or `spec`
- confirm coverage of the touched production classes did not drop (`c8` output from `yarn test`)
- confirm no file under `source/lib/` was modified (`git diff --stat -- source/lib` is empty)
- confirm the six spec files are visibly shorter and that the `it` names (including describe path) are unchanged

## Files to Change
- None — verification only. Fix any regression in the files touched by steps 01–03.
