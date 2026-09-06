# Add JSON body parsing to app.js

The collector endpoint needs `req.body` populated from JSON request bodies. `dev/app/app.js`
currently wires no body-parsing middleware. Add `express.json({ limit: '1mb' })` — Express 4.x
bundles `body-parser`, so no new dependency. The raised limit (default is 100 kb) gives
headroom for crawl emission payloads; `/collector/:source` is the only route that reads a body.

Wire it into `buildApp(data, failureRate = 0)` **after** the `FailureSimulator` middleware and
**before** `app.use(new Router(data).build())` — simulated-502 requests are short-circuited
before body parsing, and the new middleware sits directly ahead of routing. Existing GET routes
are unaffected (they never read `req.body`).

`express` is already imported in `app.js`. Malformed JSON makes `express.json()` throw a
`SyntaxError` with `status: 400`; `app.js` has no error-handling middleware, so Express's
default handler returns a plain `400`. That is acceptable for a demo target and needs no extra
handling.

## Files to Change

- `dev/app/app.js` — add `app.use(express.json({ limit: '1mb' }))` between the
  `FailureSimulator` middleware line and `app.use(new Router(data).build())`.
