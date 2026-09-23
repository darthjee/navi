# deku-sprout

Small, level-filtered logging library for Node.js, with multi-destination broadcasting and a static default logger.

`deku-sprout` is the shared logging package for [Navi](https://github.com/darthjee/navi) and its clients. It was extracted from the logging code that used to be duplicated between Navi's application and its Node client (`navi-hey-client`), and it follows the same standalone-package model as [`deku-swarm`](https://github.com/darthjee/navi/tree/main/worker). It has no Navi-specific knowledge: you get a level threshold, structured attributes, a console logger, and a way to fan one log call out to several destinations.

---

## Installation

```bash
npm install deku-sprout
```

## Library usage

```js
import { BaseLogger, ConsoleLogger, LoggerGroup, Logger } from 'deku-sprout';

// 1. Log through the static default logger (a ConsoleLogger, created on first use)
Logger.info('Server started', { port: 3000 });
Logger.setLevel('debug');
Logger.debug('Now visible');

// 2. Write your own destination by subclassing BaseLogger and implementing _output()
class MemoryLogger extends BaseLogger {
  entries = [];

  _output(level, message, attributes) {
    this.entries.push({ level, message, attributes });
  }
}

// 3. Add it next to the console, so every call goes to both
const memory = new MemoryLogger('warn');
Logger.addLogger(memory);
Logger.warn('Low memory', { freeMb: 12 }); // console + memory
Logger.info('Only on console');             // memory filters out 'info'

// 4. Or build your own group, independent of the static default
const group = new LoggerGroup([new ConsoleLogger('error'), memory]);
group.error('Request failed', { status: 502 });
```

Log levels, from most to least verbose: `debug`, `info`, `warn`, `error`, `silent`. A logger emits a message only when the message's level is at or above its threshold. `silent` turns off all output.

Every log method takes `(message, attributes = {})`. `attributes` is a plain object of structured metadata that is passed to the destination together with the message.

### `BaseLogger`

Abstract base class for a single log destination. It handles level filtering and suppression. Subclass it and implement `_output`.

| Member | Description |
|--------|-------------|
| `constructor(level)` | `level` is the threshold. Defaults to the `LOG_LEVEL` environment variable, or `'info'` if that is not set. |
| `_output(level, message, attributes)` | Must be overridden to write the entry somewhere. Called only for messages that pass the threshold and are not suppressed. The base implementation does nothing. |
| `debug` / `info` / `warn` / `error(message, attributes = {})` | Log at that level, subject to the threshold and suppression. |
| `setLevel(level)` | Changes the threshold. Throws if `level` is not one of `debug`, `info`, `warn`, `error`, `silent`. |
| `suppress(value = true)` | Suppresses all output when `true`, and restores it when `false`. |

### `ConsoleLogger`

A `BaseLogger` that writes to the console. Each entry calls `console[level](message, attributes)`. Its constructor is the same as `BaseLogger`'s: `new ConsoleLogger(level)`.

### `LoggerGroup`

Sends each log call to several loggers at once, for example the console and an in-memory buffer.

| Member | Description |
|--------|-------------|
| `constructor(loggers = [])` | `loggers` is the initial list of loggers. |
| `addLogger(logger)` / `removeLogger(logger)` | Add or remove a logger. Both return the group, so calls can be chained. |
| `getLoggers()` | Returns a copy of the logger list. |
| `debug` / `info` / `warn` / `error(message, attributes = {})` | Sends the call to every logger in the group. Each logger applies its own threshold. |
| `setLevel(level)` / `suppress(value = true)` | Applies the call to every logger in the group. |

### `Logger`

Static facade over a default `LoggerGroup` singleton. The first call creates the group with a single `ConsoleLogger`, so `Logger.info(...)` works without any setup.

| Method | Description |
|--------|-------------|
| `Logger.debug` / `info` / `warn` / `error(message, attributes = {})` | Logs through the default group. |
| `Logger.setLevel(level)` / `Logger.suppress(value = true)` | Applies the call to every logger in the default group. |
| `Logger.addLogger(logger)` | Adds another destination to the default group. |
| `Logger.setLogger(logger)` | Replaces the default group with a new group that contains only `logger`. |
| `Logger.default()` | Returns the default `LoggerGroup`, and creates it if needed. |
| `Logger.reset()` | Discards the default group. The next call creates a new one with a `ConsoleLogger`. Use it in test teardown. |

---

## Source & Documentation

GitHub repository: [darthjee/navi](https://github.com/darthjee/navi). `deku-sprout` lives under [`logger/`](https://github.com/darthjee/navi/tree/main/logger).
