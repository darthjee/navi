# Integration tests in app_spec.js

`dev/app/spec/app_spec.js` is the Supertest integration suite. It builds
`const app = buildApp(FixturesUtils.loadYamlFixture('data.yml'));` at module top and, inside
its `failureRate = 1` block, `const failingApp = buildApp(FixturesUtils.loadYamlFixture('data.yml'), 1);`.

Add:

- Under the normal-app describe — `POST /collector/oak-categories` with a JSON body
  (`request(app).post('/collector/oak-categories').send({ items: [{ id: 1 }] })`) → status
  `204`, empty response body. `spyOn(Logger, 'info')` (import `{ Logger }` from
  `../lib/common/utils/logging/Logger.js`) and assert it was called with
  `('CollectorHandler: received emission', { source: 'oak-categories', body: { items: [{ id: 1 }] } })`
  — the spy also silences the log line in test output.
- Under the `failureRate = 1` block — the same `POST /collector/x` against `failingApp` still
  → `204`, never `502`, exercising the `FailureSimulator` exemption end-to-end.

## Files to Change

- `dev/app/spec/app_spec.js` — add the `POST /collector/:source` success case and the
  `failureRate = 1` no-`502` case; import `Logger` for the log-call assertion.
