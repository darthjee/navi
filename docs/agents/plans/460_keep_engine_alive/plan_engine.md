# Plan: Engine Changes

## Overview

Add `keepAlive`, `#paused`, `pause()`, and `resume()` to `Engine`. The loop condition and allocation block are updated to respect these flags.

## Current Code

```js
class Engine {
  #sleepMs;
  #stopped = false;

  constructor({ allocator, sleepMs = 500 } = {}) {
    this.#sleepMs = sleepMs;
    this.allocator = allocator || new WorkersAllocator();
  }

  stop() {
    this.#stopped = true;
  }

  async start() {
    while (!this.#stopped && this.#continueAllocating()) {
      JobRegistry.promoteReadyJobs();
      if (JobRegistry.hasReadyJob()) {
        this.allocator.allocate();
      }
      await this.#sleep();
    }
  }

  #continueAllocating() {
    return JobRegistry.hasJob() || WorkersRegistry.hasBusyWorker();
  }
}
```

## Target Code

```js
class Engine {
  #sleepMs;
  #stopped = false;
  #paused = false;
  #keepAlive;

  constructor({ allocator, sleepMs = 500, keepAlive = false } = {}) {
    this.#sleepMs = sleepMs;
    this.#keepAlive = keepAlive;
    this.allocator = allocator || new WorkersAllocator();
  }

  stop() {
    this.#stopped = true;
  }

  pause() {
    this.#paused = true;
  }

  resume() {
    this.#paused = false;
  }

  async start() {
    while (!this.#stopped && this.#shouldContinue()) {
      JobRegistry.promoteReadyJobs();
      if (!this.#paused && JobRegistry.hasReadyJob()) {
        this.allocator.allocate();
      }
      await this.#sleep();
    }
  }

  #shouldContinue() {
    return this.#keepAlive || this.#continueAllocating();
  }

  #continueAllocating() {
    return JobRegistry.hasJob() || WorkersRegistry.hasBusyWorker();
  }
}
```

## Changes Summary

| Change | Description |
|---|---|
| `#keepAlive` flag | New private field, passed via constructor. Default `false` (CI mode). |
| `#paused` flag | New private field, starts as `false`. |
| `pause()` | Sets `#paused = true`. Allocation is skipped in the loop. |
| `resume()` | Sets `#paused = false`. Allocation resumes. |
| `#shouldContinue()` | New private method replacing the inline `#continueAllocating()` check in the loop. Returns `true` always when `keepAlive=true`. |
| Loop condition | `while (!this.#stopped && this.#shouldContinue())` |
| Allocation guard | `if (!this.#paused && JobRegistry.hasReadyJob())` |
