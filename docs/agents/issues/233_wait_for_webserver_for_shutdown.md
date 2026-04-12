# Issue: Wait for webServer for Shutdown

## Description

When both the engine and the web server are running, the application shuts down as soon as the engine finishes its promise, without waiting for the Express web server promise to complete. The application needs to wait for both promises before exiting.

## Problem

- The application exits when the engine's promise resolves, ignoring the web server's still-running promise.
- There is no coordination mechanism to wait for all running services before shutdown.

## Expected Behavior

- The application waits for both `engine.run()` and `webServer.run()` promises to resolve before exiting.

## Solution

- Create a new class (e.g., `PromiseQueue` or `WaitGroup`) that holds an array of promises.
- Expose an `add(promise)` method to register promises into the collection.
- Expose an `async wait()` method that awaits each promise in the array before returning.
- In `Application`, push both `webServer.run()` and `engine.run()` into this object and `await` the `wait()` call.

## Benefits

- Prevents premature process exit while the web server is still serving requests.
- Provides a reusable coordination primitive for any future async services added to the application.

---
See issue for details: https://github.com/darthjee/navi/issues/233
