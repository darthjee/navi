# Plan: BaseLogger_spec.js

## File
`source/spec/utils/BaseLogger_spec.js` (214 lines)

## Problem

The file contains 5 nearly identical `describe` blocks — one per log level (`debug`, `info`, `warn`,
`error`, `silent`). Each block has its own `beforeEach` that creates a new logger and sets up a spy,
followed by 4 near-identical tests checking which log methods are suppressed or forwarded.
This results in ~20 essentially identical test bodies repeated with minor variations.

## Current structure

```
describe('BaseLogger')
  beforeEach → logger = new BaseLogger('info'); spyOn(logger, '_output')

  describe('default level (info)')          ← creates its own logger in outer beforeEach
    it does not output debug
    it outputs info
    it outputs warn
    it outputs error

  describe('with level debug')
    beforeEach → logger = new BaseLogger('debug'); spyOn(...)
    it outputs debug
    it outputs info
    it outputs warn
    it outputs error

  describe('with level warn')
    beforeEach → logger = new BaseLogger('warn'); spyOn(...)
    it does not output debug
    it does not output info
    it outputs warn
    it outputs error

  describe('with level error') ...
  describe('with level silent') ...

  describe('with LOG_LEVEL env var') ...   ← keep unchanged
  describe('#suppress') ...               ← keep unchanged
  describe('#setLevel') ...               ← keep unchanged
```

## Solution

Replace the 5 level `describe` blocks with a single data-driven loop over a **level matrix**.

### Level matrix

```js
const levelMatrix = [
  ['debug',  { debug: true,  info: true,  warn: true,  error: true  }],
  ['info',   { debug: false, info: true,  warn: true,  error: true  }],
  ['warn',   { debug: false, info: false, warn: true,  error: true  }],
  ['error',  { debug: false, info: false, warn: false, error: true  }],
  ['silent', { debug: false, info: false, warn: false, error: false }],
];
```

### New structure

```js
levelMatrix.forEach(([level, expected]) => {
  describe(`with level ${level}`, () => {
    beforeEach(() => {
      logger = new BaseLogger(level);
      spyOn(logger, '_output');
    });

    ['debug', 'info', 'warn', 'error'].forEach((method) => {
      if (expected[method]) {
        it(`outputs ${method} messages`, () => {
          logger[method]('msg');
          expect(logger._output).toHaveBeenCalledWith(method, 'msg');
        });
      } else {
        it(`does not output ${method} messages`, () => {
          logger[method]('msg');
          expect(logger._output).not.toHaveBeenCalled();
        });
      }
    });
  });
});
```

The outer `beforeEach` (which creates a `new BaseLogger('info')`) becomes redundant and can be
removed — the loop now handles all level setup internally. The `with LOG_LEVEL env var`,
`#suppress`, and `#setLevel` blocks continue to rely on the outer `logger` variable and still
need a shared `beforeEach` — keep one that only covers those blocks:

```js
describe('BaseLogger', () => {
  let logger;

  // level matrix loop
  levelMatrix.forEach(...);

  // remaining blocks that use a shared logger at 'info' level
  describe('with LOG_LEVEL env var', () => { ... });
  describe('#suppress', () => {
    beforeEach(() => {
      logger = new BaseLogger('info');
      spyOn(logger, '_output');
    });
    ...
  });
  describe('#setLevel', () => {
    beforeEach(() => {
      logger = new BaseLogger('info');
      spyOn(logger, '_output');
    });
    ...
  });
});
```

## Expected outcome

- File shrinks from ~214 lines to ~80–90 lines.
- Adding a new log level requires only one new row in `levelMatrix`.
- Changing the assertion pattern requires editing one place instead of 20.
