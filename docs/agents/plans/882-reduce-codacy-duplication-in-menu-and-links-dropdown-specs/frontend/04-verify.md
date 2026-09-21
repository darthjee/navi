# Verify
Run the frontend checks from `frontend/`: `npm test` and `npm run lint`. Confirm that all four specs still pass, that the total spec count did not drop (compare with `main`), and that each original scenario is still present (skim `git diff` for removed `it(...)` titles and make sure each is either kept or covered by a shared example). Compare the line counts of the four specs against the table in the issue. Optionally run `npm run report` (jscpd) for a local duplication check before pushing.

## Files to Change
- None expected; fix any lint or spec failure in the files from steps 01-03.
