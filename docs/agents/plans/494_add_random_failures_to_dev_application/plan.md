# Plan: Add Random Failures to Dev Application

## Overview
Introduce a configurable random-failure middleware to the dev application (`dev/app/`) so that any HTTP request can be made to fail at a controlled probability. The rate is driven by the `DEV_APP_FAILURE_RATE` environment variable and defaults to 0 (no failures).

## Context
Navi's retry and failure-handling logic needs a realistic way to be exercised locally. The dev application is the backend Navi hits during development; injecting random failures there is the cleanest way to test Navi's resilience without external tooling.

The `DEV_APP_FAILURE_RATE` environment variable holds a float between 0 and 1 (e.g. `0.75` = 75% failure rate). When unset, the rate is 0 and no failures are introduced. `.env.sample` should document it at `0.5`.

## Implementation Steps

### Step 1 — Create `FailureSimulator` class
Create `dev/app/lib/FailureSimulator.js`.

- Constructor: `constructor(failureRate = 0)` — stores the rate.
- Method: `handle(req, res, next)` — if `Math.random() < this.#failureRate`, respond with HTTP 502 `{ error: 'Simulated failure' }`; otherwise call `next()`.
- Export the class as the default export.

### Step 2 — Wire `FailureSimulator` into `app.js`
Update `buildApp(data)` to accept a second parameter `failureRate = 0`.

- Instantiate `FailureSimulator(failureRate)` inside `buildApp`.
- Register it as Express middleware **before** the router: `app.use((req, res, next) => simulator.handle(req, res, next))`.

### Step 3 — Read the env var in `server.js`
In `server.js`, read `process.env.DEV_APP_FAILURE_RATE` and parse it as a float (defaulting to `0` when absent or unparseable). Pass it as the second argument to `buildApp(data, failureRate)`.

### Step 4 — Update `.env.sample`
Add the following line to `.env.sample`:
```
DEV_APP_FAILURE_RATE=0.5
```

### Step 5 — Write tests for `FailureSimulator`
Create `dev/app/spec/lib/FailureSimulator_spec.js` covering:
- Rate = 0: `handle` always calls `next()`, never responds.
- Rate = 1: `handle` always responds with 502 and never calls `next()`.
- Rate between 0 and 1: responds or continues depending on the `Math.random()` return value (spy/stub `Math.random` to control the outcome).

### Step 6 — Update `app_spec.js`
Add a test scenario where `buildApp` is called with `failureRate = 1` and verify that all routes return 500.

## Files to Change
- `dev/app/lib/FailureSimulator.js` — new class (Step 1)
- `dev/app/app.js` — accept `failureRate` param and register middleware (Step 2)
- `dev/app/server.js` — read and parse `DEV_APP_FAILURE_RATE` (Step 3)
- `.env.sample` — document the new env var (Step 4)
- `dev/app/spec/lib/FailureSimulator_spec.js` — new spec file (Step 5)
- `dev/app/spec/app_spec.js` — add failure-rate scenario (Step 6)

## CI Checks
Before opening a PR, run the following checks for the folders being modified:
- `dev/app/`: `yarn test` and `yarn lint` (CircleCI jobs: `jasmine-dev`, `checks-dev`)

## Notes
- HTTP 502 is used as the failure status; this mirrors a Bad Gateway error that Navi's retry logic would react to.
- `Math.random` must be stubbable in tests — the class should not cache a random result at construction time.
- If `DEV_APP_FAILURE_RATE` is set to an invalid value (e.g. `"abc"`), treat it as `0` (no failures): `Number.isNaN(parseFloat(value)) ? 0 : parseFloat(value)`.
