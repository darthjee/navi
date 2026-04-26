# Issue: Add Delayed Middleware

## Description

In `dev/proxy`, a new Tent middleware needs to be created and applied to all routes to introduce configurable response delays. The delay behavior is controlled via two environment variables.

## Problem

- The dev proxy currently returns responses without any artificial delay.
- There is no way to simulate slow backends during local development or testing.

## Expected Behavior

- Two environment variables control the delay: `MIN_RESPONSE_DELAY` and `MAX_RESPONSE_DELAY` (values in milliseconds).
- When neither is set: no delay is applied.
- When only `MAX_RESPONSE_DELAY` is set: a random delay between 0 and `MAX_RESPONSE_DELAY` ms.
- When only `MIN_RESPONSE_DELAY` is set: a fixed delay of exactly `MIN_RESPONSE_DELAY` ms.
- When both are set: a random delay between `MIN_RESPONSE_DELAY` and `MAX_RESPONSE_DELAY` ms.

## Solution

- Create the middleware following the instructions in `docs/HOW_TO_USE_DARTHJEE-TENT.md`.
- Reference the Tent middleware base class at `https://github.com/darthjee/tent/blob/main/source/source/lib/middlewares/Middleware.php`.
- Implement the delay logic inside `processResponse`.
- Register the middleware in all endpoint rules under `dev/proxy/rules`.

## Benefits

- Enables realistic simulation of slow backends during local development.
- Allows testing Navi's retry and timeout behavior against delayed responses.

---
See issue for details: https://github.com/darthjee/navi/issues/369
