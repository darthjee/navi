# Plan: Spec Changes

## `Engine_spec.js`

### Existing behaviour (CI mode, `keepAlive=false`)

Verify the existing tests still pass:
- Loop exits when the queue is empty.
- `stop()` exits the loop mid-run.

### New: `keepAlive=true` — loop continues when queue is empty

```js
it('keeps running when queue is empty in keepAlive mode', async () => {
  const engine = new Engine({ keepAlive: true, sleepMs: -1 });

  let iterations = 0;
  // stop after 3 iterations to avoid infinite loop in test
  spyOn(JobRegistry, 'hasJob').and.callFake(() => {
    iterations++;
    if (iterations >= 3) engine.stop();
    return false;
  });

  await engine.start();

  expect(iterations).toBeGreaterThanOrEqual(3);
});
```

### New: `pause()` — allocation is skipped

```js
it('skips allocation when paused', async () => {
  const engine = new Engine({ keepAlive: true, sleepMs: -1 });
  engine.pause();

  spyOn(engine.allocator, 'allocate');
  spyOn(JobRegistry, 'hasReadyJob').and.returnValue(true);
  spyOn(JobRegistry, 'hasJob').and.callFake(() => {
    engine.stop();
    return false;
  });

  await engine.start();

  expect(engine.allocator.allocate).not.toHaveBeenCalled();
});
```

### New: `resume()` — allocation resumes after pause

```js
it('resumes allocation after resume', async () => {
  const engine = new Engine({ keepAlive: true, sleepMs: -1 });
  engine.pause();
  engine.resume();

  spyOn(engine.allocator, 'allocate');
  spyOn(JobRegistry, 'hasReadyJob').and.callFake(() => {
    engine.stop();
    return true;
  });
  spyOn(JobRegistry, 'hasJob').and.returnValue(false);

  await engine.start();

  expect(engine.allocator.allocate).toHaveBeenCalled();
});
```

## `ApplicationInstance_spec.js`

### `pause()` — calls `engine.pause()`, not `engine.stop()`

```js
it('pauses the engine without stopping it', async () => {
  spyOn(instance.engine, 'pause');
  spyOn(instance.engine, 'stop');

  await instance.pause();

  expect(instance.engine.pause).toHaveBeenCalled();
  expect(instance.engine.stop).not.toHaveBeenCalled();
  expect(instance.status()).toBe('paused');
});
```

### `stop()` — calls `engine.pause()`, preserves engine instance

```js
it('stops without recreating the engine', async () => {
  const originalEngine = instance.engine;
  spyOn(instance.engine, 'pause');

  await instance.stop();

  expect(instance.engine).toBe(originalEngine);
  expect(instance.engine.pause).toHaveBeenCalled();
  expect(instance.status()).toBe('stopped');
});
```

### `continue()` — calls `engine.resume()`, no new engine

```js
it('resumes without creating a new engine', async () => {
  await instance.pause();
  const originalEngine = instance.engine;
  spyOn(instance.engine, 'resume');

  await instance.continue();

  expect(instance.engine).toBe(originalEngine);
  expect(instance.engine.resume).toHaveBeenCalled();
  expect(instance.status()).toBe('running');
});
```

### `start()` — calls `engine.resume()`, no new engine

```js
it('starts without creating a new engine', async () => {
  await instance.stop();
  const originalEngine = instance.engine;
  spyOn(instance.engine, 'resume');

  await instance.start();

  expect(instance.engine).toBe(originalEngine);
  expect(instance.engine.resume).toHaveBeenCalled();
  expect(instance.status()).toBe('running');
});
```

## Notes

- Use a dummy/spy engine in `ApplicationInstance` tests to avoid real async loops.
- The existing `ApplicationInstance` spec already injects workers via constructor — the same pattern applies for injecting a spy engine.
