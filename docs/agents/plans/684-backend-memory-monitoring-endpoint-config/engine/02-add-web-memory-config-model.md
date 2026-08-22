# Add the web.memory config model

Add a `MemoryConfig` class, following the nested-sub-config pattern `WebConfig` already uses for
`api` (`source/lib/models/configs/WebConfig.js`). It owns three things: resolving `maximum`
(delegating to `MemoryMaximumResolver` from step 01), validating `thresholds`, and deriving
`status` from a `percentage`.

- Constructor takes `{ maximum, thresholds = {} } = {}` (raw YAML shape) plus an injectable
  `resolver` (defaulting to `MemoryMaximumResolver`), per the project's DI convention.
- `thresholds` defaults: `{ low: 25.0, medium: 50.0, high: 75.0, over: 100.0 }` — same defaults
  as the issue's example config, applied per-key so a partial override doesn't drop the rest.
- Validate at construction time that `low < medium < high < over` strictly. On violation, throw
  a new `InvalidMemoryThresholds` error (`source/lib/exceptions/config/`, extending `AppError`
  the same way `InvalidParserType` does), so a malformed config fails boot immediately.
- `this.maximum = resolver.resolve(maximum)` — resolved once at construction (config load time),
  not per-request; cgroup/OS reads only happen once at boot.
- `statusFor(percentage)` — returns one of `"low"`/`"medium"`/`"high"`/`"over"` using **inclusive**
  (`>=`) boundaries, checked from the top down: `over` if `percentage >= thresholds.over`, else
  `high` if `percentage >= thresholds.high`, else `medium` if `percentage >= thresholds.medium`,
  else `low` (the floor — also covers `percentage < thresholds.low`).

Wire it into `WebConfig`: parse `memory = {}` from the raw config object into
`this.memory = new MemoryConfig(memory)`, same style as the existing `api` destructuring.

## Files to Change

- `source/lib/models/configs/MemoryConfig.js` — new.
- `source/lib/exceptions/config/InvalidMemoryThresholds.js` — new; extends `AppError`, message
  names which two threshold keys are out of order.
- `source/lib/models/configs/WebConfig.js` — parse and expose `memory` (uses
  `MemoryMaximumResolver` from step 01).
- `spec/lib/models/configs/MemoryConfig_spec.js` — new; cover default thresholds, partial
  threshold overrides, ascending-order validation (valid and invalid), `maximum` resolution
  delegation (via an injected dummy resolver), and `statusFor` at and around every boundary
  (inclusive semantics) plus below `low` and above `over`.
- `spec/lib/exceptions/config/InvalidMemoryThresholds_spec.js` — new.
- `spec/lib/models/configs/WebConfig_spec.js` — add coverage for the new `memory` property
  (default and custom).
