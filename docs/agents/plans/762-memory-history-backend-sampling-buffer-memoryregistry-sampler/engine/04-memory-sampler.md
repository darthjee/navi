# MemorySampler

A stateful lifecycle service that samples process RSS into `MemoryRegistry` on a fixed
interval. New `source/lib/services/memory/` folder (not `services/engine/` — see the
issue's Sampler section and the engine plan Notes).

## What to do

- `source/lib/services/memory/MemorySampler.js`:
  - Constructor takes `memoryConfig` plus injectable collaborators with global defaults:
    `{ setInterval = globalThis.setInterval, clearInterval = globalThis.clearInterval,
    rssReader = new ProcessRssReader() }`.
  - `#tick()` (private): `const value = this.#rssReader.read();
    const percentage = value / this.#memoryConfig.maximum * 100;
    MemoryRegistry.add(value, percentage);` — the whole body wrapped in `try/catch` that
    **swallows** on error (skip that sample; no logging dependency). `maximum === 0`
    (→ `Infinity`) is deliberately not guarded — identical to
    `MemoryStatusHandler.handle()`.
  - `start()`:
    - no-op if a handle already exists;
    - take **one immediate synchronous sample** (`this.#tick()`);
    - then `this.#handle = this.#setInterval(() => this.#tick(),
      this.#memoryConfig.dataStoreInterval * 1000)` (seconds → ms);
    - `this.#handle.unref?.()` — defensive against a missed `stop()`. (No other repo code
      uses `.unref()`; deliberate here. Use optional-call so an injected fake without
      `unref` doesn't break.)
  - `stop()`: idempotent — `if (this.#handle) { this.#clearInterval(this.#handle);
    this.#handle = null; }`.
- Spec `source/spec/lib/services/memory/MemorySampler_spec.js` — per the issue's
  _Testing strategy_: fake `setInterval` captures the callback; drive ticks synchronously;
  fake handle carries an `unref` spy. Assert: interval armed with
  `dataStoreInterval * 1000`; one `MemoryRegistry.add` per tick; one immediate `add` on
  `start()` before any tick; throwing `rssReader` → swallowed, handle not cleared, next
  tick still records; second `start()` → `setInterval` called once; `stop()` →
  `clearInterval(handle)`, second `stop()` no-ops; `start()` called `.unref()` on the
  handle. Build a real `MemoryRegistry` in `beforeEach` / reset in `afterEach`.

## Files to Change

- `source/lib/services/memory/MemorySampler.js` — new (new folder).
- `source/spec/lib/services/memory/MemorySampler_spec.js` — new.
