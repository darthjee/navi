
WORKERSREGISTRY STATIC METHODS REFACTORING

Technical Proposal for Architectural Improvement

10 de abril de 2026

---

### 1. Current State

The WorkersRegistry is currently instantiated in Application as an instance property, as shown in the following code snippet:

javascript
// Application.js
this.workersRegistry = workersRegistry || new WorkersRegistry({
  jobRegistry: this.jobRegistry,
  workers: this.#workers,
  ...this.config.workersConfig
});
this.workersRegistry.initWorkers();

This design necessitates passing the workersRegistry instance as an argument throughout the application lifecycle to various objects, including Engine, WebServer, Router, WorkersAllocator, and individual Worker instances.

### 2. Problem

The existing architecture leads to tight coupling between components and requires verbose dependency injection of the workersRegistry instance across multiple layers of the application. This approach is not only cumbersome but also increases the potential for errors and reduces code readability and maintainability.

### 3. Solution

The proposed solution involves migrating the WorkersRegistry to utilize static methods, mirroring the pattern already successfully implemented for JobRegistry. This refactoring will enable:


Direct access to registry functionalities via static methods, eliminating the need to pass instances around.
A cleaner and more intuitive API, allowing calls such as WorkersRegistry.initWorkers() instead of workersRegistry.initWorkers().
Simplified dependency injection throughout the application.
Improved test isolation through the introduction of a WorkersRegistry.reset() static method.


### 4. Implementation Plan

#### 4.1 Step 1: Add Static Instance Property

A private static instance property will be added to the WorkersRegistry class to hold the singleton instance. This ensures that only one instance of the registry is managed globally.

```javascript
class WorkersRegistry {
  static #instance = null;
  // ... existing code
}
```

#### 4.2 Step 2: Add Static Initialization Method

A static method, init(), will be created to handle the initialization of the singleton instance. This method will be responsible for creating and storing the single WorkersRegistry instance.

```javascript
static init({ jobRegistry, quantity, factory, workers, busy, idle }) {
  WorkersRegistry.#instance = new WorkersRegistry({
    jobRegistry,
    quantity,
    factory,
    workers,
    busy,
    idle
  });
  return WorkersRegistry.#instance;
}
```

#### 4.3 Step 3: Add Static Delegation Methods

Static methods will be implemented for all core functionalities that currently exist as instance methods. These static methods will delegate their calls to the internally managed singleton instance, ensuring that the public API remains consistent while abstracting the instance management.

```javascript
static initWorkers() {
  if (!WorkersRegistry.#instance) {
    throw new Error('WorkersRegistry not initialized. Call WorkersRegistry.init() first.');
  }
  return WorkersRegistry.#instance.initWorkers();
}

static setBusy(workerId) {
  if (!WorkersRegistry.#instance) {
    throw new Error('WorkersRegistry not initialized. Call WorkersRegistry.init() first.');
  }
  return WorkersRegistry.#instance.setBusy(workerId);
}

static setIdle(workerId) {
  if (!WorkersRegistry.#instance) {
    throw new Error('WorkersRegistry not initialized. Call WorkersRegistry.init() first.');
  }
  return WorkersRegistry.#instance.setIdle(workerId);
}

static hasBusyWorker() {
  if (!WorkersRegistry.#instance) {
    throw new Error('WorkersRegistry not initialized. Call WorkersRegistry.init() first.');
  }
  return WorkersRegistry.#instance.hasBusyWorker();
}

static hasIdleWorker() {
  if (!WorkersRegistry.#instance) {
    throw new Error('WorkersRegistry not initialized. Call WorkersRegistry.init() first.');
  }
  return WorkersRegistry.#instance.hasIdleWorker();
}

static getIdleWorker() {
  if (!WorkersRegistry.#instance) {
    throw new Error('WorkersRegistry not initialized. Call WorkersRegistry.init() first.');
  }
  return WorkersRegistry.#instance.getIdleWorker();
}

static stats() {
  if (!WorkersRegistry.#instance) {
    throw new Error('WorkersRegistry not initialized. Call WorkersRegistry.init() first.');
  }
  return WorkersRegistry.#instance.stats();
}
```

#### 4.4 Step 4: Add Static Reset Method (for Tests)

A static reset() method will be added specifically for testing purposes. This method will allow the singleton instance to be cleared, ensuring a clean state between test runs and preventing test pollution.

```javascript
static reset() {
  WorkersRegistry.#instance = null;
}
```

#### 4.5 Step 5: Update Application Class

The Application class will be modified to replace the direct instance initialization of workersRegistry with a static call to WorkersRegistry.init(). This change centralizes the registry's setup.

```javascript
// Before
this.workersRegistry = workersRegistry || new WorkersRegistry({
  jobRegistry: this.jobRegistry,
  workers: this.#workers,
  ...this.config.workersConfig
});
this.workersRegistry.initWorkers();

// After
WorkersRegistry.init({
  jobRegistry: this.jobRegistry,
  quantity: this.config.workersConfig.quantity,
  workers: this.#workers,
  ...this.config.workersConfig
});
WorkersRegistry.initWorkers();
```

#### 4.6 Step 6: Update All References

All existing instance method calls to workersRegistry across the application will be updated to use the new static method calls. This includes modifications in Engine.js, Worker.js, WorkersAllocator.js, and Router.js.

##### Engine.js

```javascript
// Before
this.#workersRegistry.hasBusyWorker()

// After
WorkersRegistry.hasBusyWorker()
```

##### Worker.js

```javascript
// Before
this.workerRegistry.setIdle(this.id)

// After
WorkersRegistry.setIdle(this.id)
```

##### WorkersAllocator.js

```javascript
// Before
this.workersRegistry.hasIdleWorker()
this.workersRegistry.getIdleWorker()

// After
WorkersRegistry.hasIdleWorker()
WorkersRegistry.getIdleWorker()
```

##### Router.js

```javascript
// Before
new StatsRequestHandler({
  jobRegistry: this.#jobRegistry,
  workersRegistry: this.#workersRegistry,
})

// After
new StatsRequestHandler({
  jobRegistry: this.#jobRegistry,
})
// And update StatsRequestHandler to use WorkersRegistry.stats()
```

#### 4.7 Step 7: Update Test Setup

In all relevant test files, a call to WorkersRegistry.reset() will be added within the afterEach hook. This ensures that the WorkersRegistry singleton is reset to a clean state after each test, preventing side effects between tests.

```javascript
afterEach(() => {
  JobFactory.reset();
  WorkersRegistry.reset();
});
```

### 5. Backward Compatibility

To ensure a smooth transition and maintain flexibility, the following backward compatibility considerations will be observed:


The instance constructor of WorkersRegistry will remain unchanged, allowing for continued dependency injection in specific testing scenarios if required.
The new static methods are additive; existing instance methods will remain functional, although their use will be deprecated in favor of the static API.
Tests will retain the ability to inject custom instances via the constructor, providing an escape hatch for complex testing setups.


### 6. Testing Checklist

A comprehensive testing phase will be conducted to validate the refactoring. The following checklist outlines the key areas to be covered:


[ ] Unit tests for all newly introduced static methods.
[ ] Verification that WorkersRegistry.init() correctly creates and manages the singleton instance.
[ ] Confirmation that WorkersRegistry.reset() effectively clears the singleton instance.
[ ] Validation that an error is thrown when static methods are called before WorkersRegistry.init().
[ ] Integration tests covering the interaction between Application, Engine, and Worker with the refactored registry.
[ ] Verification of test isolation, ensuring that the registry is properly reset between tests.
[ ] Confirmation that the stats endpoint continues to function correctly, retrieving data from the refactored registry.
[ ] Validation of worker state transitions (busy/idle) through the new static methods.


### 7. Rollback Plan

In the event that unforeseen issues arise during or after the implementation of this refactoring, a clear rollback plan is established to revert to the previous state:


Keep all existing instance methods of WorkersRegistry intact.
Remove all newly added static methods from the WorkersRegistry class.
Revert the Application class to its original instance-based initialization of workersRegistry.
Revert all call sites across the application (e.g., Engine.js, Worker.js) to use the instance method calls instead of the static ones.


### 8. Files to Modify

The following files will require modifications as part of this refactoring effort:


source/lib/registry/WorkersRegistry.js - To add static methods and the private static instance property.
source/lib/services/Application.js - To update the registry initialization logic.
source/lib/services/Engine.js - To update method calls from instance to static.
source/lib/models/Worker.js - To update method calls from instance to static.
source/lib/services/WorkersAllocator.js - To update method calls from instance to static.
source/lib/server/Router.js - To update handler initialization, removing the workersRegistry dependency.
source/lib/server/StatsRequestHandler.js - To update its internal logic to use the new static methods.
Test files - To add WorkersRegistry.reset() to the afterEach hooks for proper test isolation.


### 9. Benefits

This refactoring is expected to yield several significant benefits for the application's architecture and development process:


✅ Eliminates verbose dependency injection, simplifying component interactions.
✅ Provides a cleaner, more intuitive API for interacting with the worker registry.
✅ Ensures consistency with the established JobRegistry pattern, promoting a unified architectural style.
✅ Achieves better test isolation through the introduction of the reset() method, leading to more reliable tests.
✅ Reduces coupling between different layers of the application, enhancing modularity.
✅ Facilitates easier maintenance and extension of the worker management system.


10 de abril de 2026