# Engine Plan: Reorganize source/lib/services

Main plan: [plan.md](plan.md)

## Steps

- [01 — Move service source files into subfolders](engine/01-move-service-sources.md)
- [02 — Extract Client.js into source/lib/client](engine/02-extract-client.md)
- [03 — Move matching specs alongside their sources](engine/03-move-specs.md)
- [04 — Update remaining external imports and verify green](engine/04-update-imports-and-verify.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `scripts/ci.sh lint-and-report source` — locally `yarn lint` + `yarn report` (CI job: `checks`)

## Notes

- No behavior change is expected anywhere in this plan — every step is a pure
  move-and-relint of existing code.
- `source/lib/services/ConfigParser.js` imports `Client.js`; that import only
  becomes resolvable once Step 02 has moved `Client.js` — do Steps 01 and 02
  in order, not in parallel, or `ConfigParser.js` will point at a dangling path
  between them.
- Neither `source/lib/services/` nor `source/spec/lib/services/` currently has
  an `index.js` barrel file (unlike `source/lib/utils/`), and the issue's own
  reference point, `source/lib/models/configs/`, doesn't have one either — so
  none of these steps introduce one.
