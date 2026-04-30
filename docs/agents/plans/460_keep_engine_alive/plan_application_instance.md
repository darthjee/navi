# Plan: ApplicationInstance Changes

## Overview

Update lifecycle methods so that in web mode the Engine instance is never recreated and its promise is never replaced. `buildEngine()` is called only once, in `run()`.

## `buildEngine()` — pass `keepAlive`

```js
buildEngine() {
  return new Engine({
    sleepMs: this.#sleepMs ?? this.config.workersConfig.sleep,
    keepAlive: !!this.webServer,
  });
}
```

## `pause()` — use `engine.pause()` instead of `engine.stop()`

```js
async pause() {
  this.#engineStatus = 'pausing';
  this.engine.pause();
  await this.#waitForWorkersIdle();
  this.#engineStatus = 'paused';
}
```

## `stop()` — use `engine.pause()`, preserve engine instance

```js
async stop() {
  this.#engineStatus = 'stopping';
  this.engine.pause();
  await this.#waitForWorkersIdle();
  JobRegistry.clearQueues();
  this.#engineStatus = 'stopped';
}
```

## `continue()` — use `engine.resume()`, no new engine

```js
async continue() {
  if (this.#engineStatus !== 'paused') return;
  this.engine.resume();
  this.#engineStatus = 'running';
}
```

## `start()` — use `engine.resume()`, no new engine

```js
async start() {
  if (this.#engineStatus !== 'stopped') return;
  this.engine.resume();
  this.enqueueFirstJobs();
  this.#engineStatus = 'running';
}
```

## `shutdown()` — unchanged (still calls `engine.stop()`)

```js
async shutdown() {
  this.webServer?.shutdown();
  if (this.#engineStatus === 'running') {
    await this.stop();
  }
}
```

## Changes Summary

| Method | Old | New |
|---|---|---|
| `buildEngine()` | No `keepAlive` | Passes `keepAlive: !!this.webServer` |
| `pause()` | `engine.stop()` | `engine.pause()` |
| `stop()` | `engine.stop()` + new engine on resume | `engine.pause()` — engine preserved |
| `continue()` | `buildEngine()` + `engine.start()` | `engine.resume()` |
| `start()` | `buildEngine()` + `engine.start()` | `engine.resume()` + enqueue |
| `shutdown()` | `engine.stop()` | unchanged |
