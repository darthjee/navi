# Issue: Refactor Job class: create base class and rename current Job

## Description

The current `Job` class is tightly coupled to processing `ResourceRequest`. As the codebase grows, additional job types will be needed. This issue refactors the Job hierarchy to improve extensibility and clarity.

## Problem

- The `Job` class is named generically but only handles `ResourceRequest` processing.
- There is no base class or interface defining a common contract for all jobs.
- Adding new job types would require workarounds or naming confusion.

## Expected Behavior

- A base `Job` class (or `BaseJob`) exists, defining a `perform` abstract method.
- The current `Job` class is renamed to `ResourceRequestJob` and extends the base.
- All existing references are updated to use the new class names.

## Solution

- Rename the current `Job` class to `ResourceRequestJob`.
- Create a new `BaseJob` (or `Job`) abstract/base class with a `perform` method that throws if not overridden:

```javascript
// jobs/base_job.js
class BaseJob {
  perform() {
    throw new Error('You must implement the perform method in a subclass');
  }
}

module.exports = BaseJob;
```

```javascript
// jobs/resource_request_job.js
const BaseJob = require('./base_job');

class ResourceRequestJob extends BaseJob {
  perform() {
    // Existing logic for processing ResourceRequest
  }
}

module.exports = ResourceRequestJob;
```

- Move methods that are not directly required by `perform` into `BaseJob`, so subclasses inherit them automatically. Examples include: `readyBy`, `applyCooldown`, `isReadyBy`, `exhausted`, `_fail`.
- Update all references throughout the codebase to use the new class names as appropriate.

## Benefits

- Prepares the codebase to support multiple types of Jobs in the future.
- Improves maintainability and code organization.
- Establishes a clear contract (`perform`) for all job implementations.
- Shared lifecycle methods (`readyBy`, `applyCooldown`, `isReadyBy`, `exhausted`, `_fail`) live in one place, reducing duplication across future job types.

---
See issue for details: https://github.com/darthjee/navi/issues/192
