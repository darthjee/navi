# Steps: Add Logs to Dev App

## [ ] Step 1 — Add `morgan` dependency
Run `yarn add morgan` inside `dev/app/`.

## [ ] Step 2 — Mount morgan middleware in `app.js`
Import `morgan` and add `app.use(morgan('combined'))` before `app.use(new Router(data).build())`.

## [ ] Step 3 — Run CI checks locally
- `yarn test` (jasmine-dev)
- `yarn lint` (checks-dev)

## [ ] Step 4 — Commit and open PR
