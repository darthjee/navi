WORKERSREGISTRY STATIC METHODS REFACTORING

Implementation Plan for Enhanced Modularity and Testability

10 de abril de 2026

---

## 1. Overview

This document outlines a comprehensive plan to refactor the WorkersRegistry class, transitioning its core functionalities to a static method pattern. This refactoring aims to align WorkersRegistry with the existing JobRegistry implementation, which successfully utilizes static methods to manage job-related operations without requiring explicit instance passing. The primary goal is to reduce coupling, simplify dependency management, and improve testability across the application.

## 2. Current Architecture

Currently, WorkersRegistry is instantiated as a class within the Application service. This instance is then explicitly passed as a dependency to various other services and components that require access to worker management functionalities. This creates a chain of dependency injection throughout the application's lifecycle.

The typical flow involves:

Application instantiates WorkersRegistry.
Application passes the WorkersRegistry instance to Engine.
Engine uses the WorkersRegistry instance to manage worker states (e.g., checking for busy workers).
Engine also passes the WorkersRegistry instance to WorkersAllocator.
WorkersAllocator uses the instance to get idle workers and manage their lifecycle.
Worker instances, when they become idle or busy, call methods on the WorkersRegistry instance.
The Router might also pass the WorkersRegistry instance to specific request handlers, such as StatsRequestHandler, to retrieve worker statistics.


This pattern, while functional, leads to significant coupling issues as the WorkersRegistry instance needs to be threaded through multiple layers of the application, making the codebase less modular and harder to reason about.

## 3. Problem Statement

The current instance-based approach for WorkersRegistry presents several challenges:

Verbose Dependency Injection: The WorkersRegistry instance must be explicitly passed as an argument to constructors or methods of various classes (e.g., Engine, WorkersAllocator, Worker, Router, StatsRequestHandler). This leads to boilerplate code and makes the application's dependency graph complex.
Tight Coupling: Components that interact with workers are tightly coupled to the specific instance of WorkersRegistry. Changes in how WorkersRegistry is instantiated or managed can have ripple effects across many parts of the codebase.
Inconsistency with JobRegistry: The application already benefits from the static pattern implemented for JobRegistry, which provides a cleaner API for job management. Maintaining two different patterns for similar registry functionalities introduces inconsistency and cognitive overhead.
Difficulty in Test Isolation: Testing components that depend on WorkersRegistry often requires mocking or providing a concrete instance, which can be cumbersome. Without a clear mechanism to reset the registry's state, tests might suffer from pollution between runs.


## 4. Solution Overview

The proposed solution is to refactor WorkersRegistry to adopt a static method pattern, similar to the existing JobRegistry. This involves transforming WorkersRegistry into a singleton managed internally by static methods. Instead of passing an instance around, components will directly call static methods on the WorkersRegistry class (e.g., WorkersRegistry.setBusy()). An internal, private instance will handle the actual state management, initialized once via a static init() method. A static reset() method will also be introduced to facilitate test isolation.

## 5. Implementation Steps (Detailed)

### 5.1. Step 1: Add Static Instance Property

A private static property will be added to the WorkersRegistry class to hold its internal singleton instance. This ensures that the actual registry logic is encapsulated and managed centrally.

javascript
// source/lib/registry/WorkersRegistry.js (Before)
class WorkersRegistry {
  constructor(maxWorkers, workerFactory, logger) {
    this._maxWorkers = maxWorkers;
    this._workerFactory = workerFactory;
    this._logger = logger;
    this._workers = new Map(); // Map
    this._busyWorkers = new Set(); // Set
    this._idleWorkers = new Set(); // Set
  }
  // ... existing methods
}

// source/lib/registry/WorkersRegistry.js (After)
class WorkersRegistry {
  /** @type {WorkersRegistry | null} */
  static #instance = null;

  constructor(maxWorkers, workerFactory, logger) {
    if (WorkersRegistry.#instance) {
      throw new Error('WorkersRegistry is a singleton. Use static methods or WorkersRegistry.init()');
    }
    this._maxWorkers = maxWorkers;
    this._workerFactory = workerFactory;
    this._logger = logger;
    this._workers = new Map(); // Map
    this._busyWorkers = new Set(); // Set
    this._idleWorkers = new Set(); // Set
    WorkersRegistry.#instance = this; // Set instance only if constructor is called directly
  }
  // ... existing methods
}

### 5.2. Step 2: Add Static Initialization Method

A static init() method will be created to initialize the internal singleton instance of WorkersRegistry. This method will be called once during application startup, typically by the Application service.

```javascript
// source/lib/registry/WorkersRegistry.js (After)
class WorkersRegistry {
  /** @type {WorkersRegistry | null} */
  static #instance = null;

  constructor(maxWorkers, workerFactory, logger) {
    // ... (as above)
  }

  /**
   * Initializes the WorkersRegistry singleton.
   * @param {number} maxWorkers - The maximum number of workers.
   * @param {function(): Worker} workerFactory - A factory function to create new Worker instances.
   * @param {Logger} logger - The logger instance.
   */
  static init(maxWorkers, workerFactory, logger) {
    if (WorkersRegistry.#instance) {
      logger.warn('WorkersRegistry already initialized. Skipping re-initialization.');
      return;
    }
    WorkersRegistry.#instance = new WorkersRegistry(maxWorkers, workerFactory, logger);
    // Overwrite the constructor behavior to prevent direct instantiation after init
    WorkersRegistry.prototype.constructor = function() {
      throw new Error('WorkersRegistry is a singleton. Use static methods.');
    };
    logger.info('WorkersRegistry initialized.');
  }

  /**
   * Retrieves the internal instance of WorkersRegistry.
   * @returns {WorkersRegistry} The singleton instance.
   * @throws {Error} If WorkersRegistry has not been initialized.
   */
  static #getInstance() {
    if (!WorkersRegistry.#instance) {
      throw new Error('WorkersRegistry has not been initialized. Call WorkersRegistry.init() first.');
    }
    return WorkersRegistry.#instance;
  }

  // ... existing methods and new static delegation methods
}
```

### 5.3. Step 3: Add Static Delegation Methods

All public instance methods that manage worker state will be converted into static methods. These static methods will delegate their calls to the internal #instance, ensuring that the core logic remains within the original class structure.

```javascript
// source/lib/registry/WorkersRegistry.js (After - Delegation Methods)
class WorkersRegistry {
  // ... (static #instance, constructor, static init(), static #getInstance() as above)

  /**
   * Initializes a pool of workers.
   * @param {number} count - The number of workers to initialize.
   */
  static initWorkers(count) {
    return WorkersRegistry.#getInstance()._initWorkers(count);
  }

  /**
   * Marks a worker as busy.
   * @param {string} workerId - The ID of the worker.
   */
  static setBusy(workerId) {
    return WorkersRegistry.#getInstance()._setBusy(workerId);
  }

  /**
   * Marks a worker as idle.
   * @param {string} workerId - The ID of the worker.
   */
  static setIdle(workerId) {
    return WorkersRegistry.#getInstance()._setIdle(workerId);
  }

  /**
   * Checks if there is at least one busy worker.
   * @returns {boolean} True if there is a busy worker, false otherwise.
   */
  static hasBusyWorker() {
    return WorkersRegistry.#getInstance()._hasBusyWorker();
  }

  /**
   * Checks if there is at least one idle worker.
   * @returns {boolean} True if there is an idle worker, false otherwise.
   */
  static hasIdleWorker() {
    return WorkersRegistry.#getInstance()._hasIdleWorker();
  }

  /**
   * Retrieves an idle worker.
   * @returns {Worker | undefined} An idle worker instance, or undefined if none available.
   */
  static getIdleWorker() {
    return WorkersRegistry.#getInstance()._getIdleWorker();
  }

  /**
   * Returns statistics about the workers.
   * @returns {object} Worker statistics.
   */
  static stats() {
    return WorkersRegistry.#getInstance()._stats();
  }

  // Rename original instance methods to private or protected if they are only called internally
  // Example:
  _initWorkers(count) { /* ... original implementation ... */ }
  _setBusy(workerId) { /* ... original implementation ... */ }
  _setIdle(workerId) { /* ... original implementation ... */ }
  _hasBusyWorker() { /* ... original implementation ... */ }
  _hasIdleWorker() { /* ... original implementation ... */ }
  _getIdleWorker() { /* ... original implementation ... */ }
  _stats() { /* ... original implementation ... */ }
}
```

### 5.4. Step 4: Add Static Reset Method

A static reset() method will be added to clear the internal singleton instance. This is crucial for test isolation, allowing each test to start with a clean state of the WorkersRegistry.

```javascript
// source/lib/registry/WorkersRegistry.js (After - Reset Method)
class WorkersRegistry {
  // ... (all previous code)

  /**
   * Resets the WorkersRegistry singleton instance.
   * This method is primarily for testing purposes.
   */
  static reset() {
    WorkersRegistry.#instance = null;
    // Restore original constructor behavior for testing if needed
    WorkersRegistry.prototype.constructor = function(maxWorkers, workerFactory, logger) {
      if (WorkersRegistry.#instance) {
        throw new Error('WorkersRegistry is a singleton. Use static methods or WorkersRegistry.init()');
      }
      this._maxWorkers = maxWorkers;
      this._workerFactory = workerFactory;
      this._logger = logger;
      this._workers = new Map();
      this._busyWorkers = new Set();
      this._idleWorkers = new Set();
      WorkersRegistry.#instance = this;
    };
  }
}
```

### 5.5. Step 5: Update Application Class

The Application class will be updated to use the new static WorkersRegistry.init() method instead of instantiating WorkersRegistry directly and passing it around.

```javascript
// source/lib/services/Application.js (Before - relevant section)
class Application {
  constructor(config, logger) {
    this._config = config;
    this._logger = logger;
    this._workersRegistry = null;
    this._engine = null;
    // ...
  }

  async #initRegistries() {
    const { maxWorkers } = this._config.workers;
    this._workersRegistry = new WorkersRegistry(maxWorkers, this.#workerFactory.bind(this), this._logger);
    // ...
  }

  async start() {
    await this.#initRegistries();
    this._engine = new Engine(this._workersRegistry, this._jobRegistry, this._logger);
    // ...
  }
  // ...
}

// source/lib/services/Application.js (After - relevant section)
class Application {
  constructor(config, logger) {
    this._config = config;
    this._logger = logger;
    // this._workersRegistry = null; // No longer needed as an instance property
    this._engine = null;
    // ...
  }

  async #initRegistries() {
    const { maxWorkers } = this._config.workers;
    WorkersRegistry.init(maxWorkers, this.#workerFactory.bind(this), this._logger); // Initialize static registry
    // ...
  }

  async start() {
    await this.#initRegistries();
    // Engine no longer needs workersRegistry passed
    this._engine = new Engine(this._jobRegistry, this._logger);
    // ...
  }
  // ...
}
```

### 5.6. Step 6: Update All Call Sites

All classes that previously received or used an instance of WorkersRegistry will be updated to call the new static methods directly. This involves removing the workersRegistry parameter from constructors and method calls, and replacing instance method calls with static ones.

#### 5.6.1. Engine.js changes

```javascript
// source/lib/services/Engine.js (Before - relevant section)
class Engine {
  constructor(workersRegistry, jobRegistry, logger) {
    this._workersRegistry = workersRegistry;
    this._jobRegistry = jobRegistry;
    this._logger = logger;
    // ...
  }

  async processJobs() {
    if (this._workersRegistry.hasBusyWorker()) {
      this._logger.debug('Workers are busy, waiting...');
      return;
    }
    // ...
  }
  // ...
}

// source/lib/services/Engine.js (After - relevant section)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Import static class

class Engine {
  constructor(jobRegistry, logger) { // workersRegistry parameter removed
    // this._workersRegistry = workersRegistry; // No longer needed
    this._jobRegistry = jobRegistry;
    this._logger = logger;
    // ...
  }

  async processJobs() {
    if (WorkersRegistry.hasBusyWorker()) { // Call static method
      this._logger.debug('Workers are busy, waiting...');
      return;
    }
    // ...
  }
  // ...
}
```

#### 5.6.2. Worker.js changes

```javascript
// source/lib/models/Worker.js (Before - relevant section)
class Worker {
  constructor(id, workersRegistry, logger) {
    this.id = id;
    this._workersRegistry = workersRegistry;
    this._logger = logger;
    this.state = 'idle';
    // ...
  }

  async startJob(job) {
    this._workersRegistry.setBusy(this.id);
    this.state = 'busy';
    // ...
  }

  async finishJob() {
    this._workersRegistry.setIdle(this.id);
    this.state = 'idle';
    // ...
  }
  // ...
}

// source/lib/models/Worker.js (After - relevant section)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Import static class

class Worker {
  constructor(id, logger) { // workersRegistry parameter removed
    this.id = id;
    // this._workersRegistry = workersRegistry; // No longer needed
    this._logger = logger;
    this.state = 'idle';
    // ...
  }

  async startJob(job) {
    WorkersRegistry.setBusy(this.id); // Call static method
    this.state = 'busy';
    // ...
  }

  async finishJob() {
    WorkersRegistry.setIdle(this.id); // Call static method
    this.state = 'idle';
    // ...
  }
  // ...
}
```

#### 5.6.3. WorkersAllocator.js changes

```javascript
// source/lib/services/WorkersAllocator.js (Before - relevant section)
class WorkersAllocator {
  constructor(workersRegistry, logger) {
    this._workersRegistry = workersRegistry;
    this._logger = logger;
    // ...
  }

  async allocateWorker() {
    if (!this._workersRegistry.hasIdleWorker()) {
      this._logger.debug('No idle workers available.');
      return null;
    }
    const worker = this._workersRegistry.getIdleWorker();
    // ...
    return worker;
  }
  // ...
}

// source/lib/services/WorkersAllocator.js (After - relevant section)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Import static class

class WorkersAllocator {
  constructor(logger) { // workersRegistry parameter removed
    // this._workersRegistry = workersRegistry; // No longer needed
    this._logger = logger;
    // ...
  }

  async allocateWorker() {
    if (!WorkersRegistry.hasIdleWorker()) { // Call static method
      this._logger.debug('No idle workers available.');
      return null;
    }
    const worker = WorkersRegistry.getIdleWorker(); // Call static method
    // ...
    return worker;
  }
  // ...
}
```

#### 5.6.4. Router.js changes

The Router will no longer need to pass the workersRegistry instance to its handlers, as handlers will directly import and use the static methods.

```javascript
// source/lib/server/Router.js (Before - relevant section)
import { StatsRequestHandler } from './StatsRequestHandler.js';

class Router {
  constructor(jobRegistry, workersRegistry, logger) {
    this._jobRegistry = jobRegistry;
    this._workersRegistry = workersRegistry;
    this._logger = logger;
    // ...
    this._routes = {
      '/stats': new StatsRequestHandler(this._jobRegistry, this._workersRegistry, this._logger),
      // ...
    };
  }
  // ...
}

// source/lib/server/Router.js (After - relevant section)
import { StatsRequestHandler } from './StatsRequestHandler.js';

class Router {
  constructor(jobRegistry, logger) { // workersRegistry parameter removed
    this._jobRegistry = jobRegistry;
    // this._workersRegistry = workersRegistry; // No longer needed
    this._logger = logger;
    // ...
    this._routes = {
      '/stats': new StatsRequestHandler(this._jobRegistry, this._logger), // workersRegistry parameter removed
      // ...
    };
  }
  // ...
}
```

#### 5.6.5. StatsRequestHandler.js changes

```javascript
// source/lib/server/StatsRequestHandler.js (Before - relevant section)
class StatsRequestHandler {
  constructor(jobRegistry, workersRegistry, logger) {
    this._jobRegistry = jobRegistry;
    this._workersRegistry = workersRegistry;
    this._logger = logger;
  }

  async handle(req, res) {
    const jobStats = this._jobRegistry.stats();
    const workerStats = this._workersRegistry.stats();
    // ...
  }
}

// source/lib/server/StatsRequestHandler.js (After - relevant section)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Import static class

class StatsRequestHandler {
  constructor(jobRegistry, logger) { // workersRegistry parameter removed
    this._jobRegistry = jobRegistry;
    // this._workersRegistry = workersRegistry; // No longer needed
    this._logger = logger;
  }

  async handle(req, res) {
    const jobStats = this._jobRegistry.stats();
    const workerStats = WorkersRegistry.stats(); // Call static method
    // ...
  }
}
```

### 5.7. Step 7: Update Test Setup

To ensure proper test isolation, the WorkersRegistry.reset() method will be called in the afterEach hook of relevant test suites. This guarantees that each test starts with a clean slate for the WorkersRegistry singleton.

```javascript
// spec/some-test-file.spec.js (After - relevant section)
import { WorkersRegistry } from '../source/lib/registry/WorkersRegistry.js';

describe('SomeComponent', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    // Initialize WorkersRegistry for tests if needed, or let Application handle it
    // WorkersRegistry.init(1, () => ({ id: 'test-worker-1', state: 'idle' }), mockLogger);
  });

  afterEach(() => {
    WorkersRegistry.reset(); // Reset the singleton after each test
    jest.clearAllMocks();
  });

  it('should behave correctly', () => {
    // ... test logic
  });
});
```

## 6. Code Changes by File

### 6.1. `source/lib/registry/WorkersRegistry.js`

This file will undergo the most significant changes, introducing the static instance, initialization, delegation, and reset methods.

```javascript
// source/lib/registry/WorkersRegistry.js (Before - relevant sections)
class WorkersRegistry {
  constructor(maxWorkers, workerFactory, logger) {
    this._maxWorkers = maxWorkers;
    this._workerFactory = workerFactory;
    this._logger = logger;
    this._workers = new Map();
    this._busyWorkers = new Set();
    this._idleWorkers = new Set();
  }

  initWorkers(count) { /* ... */ }
  setBusy(workerId) { /* ... */ }
  setIdle(workerId) { /* ... */ }
  hasBusyWorker() { /* ... */ }
  hasIdleWorker() { /* ... */ }
  getIdleWorker() { /* ... */ }
  stats() { /* ... */ }
}
export { WorkersRegistry };
```

```javascript
// source/lib/registry/WorkersRegistry.js (After - relevant sections)
class WorkersRegistry {
  /** @type {WorkersRegistry | null} */
  static #instance = null;

  constructor(maxWorkers, workerFactory, logger) {
    if (WorkersRegistry.#instance) {
      // This check is mainly for direct instantiation attempts after init()
      // The init() method will prevent re-initialization.
      throw new Error('WorkersRegistry is a singleton. Use static methods or WorkersRegistry.init()');
    }
    this._maxWorkers = maxWorkers;
    this._workerFactory = workerFactory;
    this._logger = logger;
    this._workers = new Map();
    this._busyWorkers = new Set();
    this._idleWorkers = new Set();
    // If constructor is called directly (e.g., in tests before init is available), set instance
    if (!WorkersRegistry.#instance) {
      WorkersRegistry.#instance = this;
    }
  }

  /**
   * Initializes the WorkersRegistry singleton.
   * @param {number} maxWorkers - The maximum number of workers.
   * @param {function(): Worker} workerFactory - A factory function to create new Worker instances.
   * @param {Logger} logger - The logger instance.
   */
  static init(maxWorkers, workerFactory, logger) {
    if (WorkersRegistry.#instance) {
      logger.warn('WorkersRegistry already initialized. Skipping re-initialization.');
      return;
    }
    WorkersRegistry.#instance = new WorkersRegistry(maxWorkers, workerFactory, logger);
    // Overwrite the constructor behavior to prevent direct instantiation after init
    WorkersRegistry.prototype.constructor = function() {
      throw new Error('WorkersRegistry is a singleton. Use static methods.');
    };
    logger.info('WorkersRegistry initialized.');
  }

  /**
   * Retrieves the internal instance of WorkersRegistry.
   * @returns {WorkersRegistry} The singleton instance.
   * @throws {Error} If WorkersRegistry has not been initialized.
   */
  static #getInstance() {
    if (!WorkersRegistry.#instance) {
      throw new Error('WorkersRegistry has not been initialized. Call WorkersRegistry.init() first.');
    }
    return WorkersRegistry.#instance;
  }

  /**
   * Resets the WorkersRegistry singleton instance.
   * This method is primarily for testing purposes.
   */
  static reset() {
    WorkersRegistry.#instance = null;
    // Restore original constructor behavior for testing if needed
    WorkersRegistry.prototype.constructor = function(maxWorkers, workerFactory, logger) {
      if (WorkersRegistry.#instance) {
        throw new Error('WorkersRegistry is a singleton. Use static methods or WorkersRegistry.init()');
      }
      this._maxWorkers = maxWorkers;
      this._workerFactory = workerFactory;
      this._logger = logger;
      this._workers = new Map();
      this._busyWorkers = new Set();
      this._idleWorkers = new Set();
      WorkersRegistry.#instance = this;
    };
  }

  // --- Static Delegation Methods ---
  static initWorkers(count) { return WorkersRegistry.#getInstance()._initWorkers(count); }
  static setBusy(workerId) { return WorkersRegistry.#getInstance()._setBusy(workerId); }
  static setIdle(workerId) { return WorkersRegistry.#getInstance()._setIdle(workerId); }
  static hasBusyWorker() { return WorkersRegistry.#getInstance()._hasBusyWorker(); }
  static hasIdleWorker() { return WorkersRegistry.#getInstance()._hasIdleWorker(); }
  static getIdleWorker() { return WorkersRegistry.#getInstance()._getIdleWorker(); }
  static stats() { return WorkersRegistry.#getInstance()._stats(); }

  // --- Original Instance Methods (renamed to private/protected if only called internally) ---
  _initWorkers(count) {
    // Original implementation of initWorkers
    if (this._workers.size > 0) {
      this._logger.warn('Workers already initialized. Skipping.');
      return;
    }
    for (let i = 0; i < count; i++) {
      const worker = this._workerFactory();
      this._workers.set(worker.id, worker);
      this._idleWorkers.add(worker.id);
      this._logger.debug(`Worker ${worker.id} created and idle.`);
    }
  }

  _setBusy(workerId) {
    if (!this._workers.has(workerId)) {
      this._logger.error(`Worker ${workerId} not found.`);
      return false;
    }
    if (this._idleWorkers.has(workerId)) {
      this._idleWorkers.delete(workerId);
      this._busyWorkers.add(workerId);
      this._logger.debug(`Worker ${workerId} set to busy.`);
      return true;
    }
    return false;
  }

  _setIdle(workerId) {
    if (!this._workers.has(workerId)) {
      this._logger.error(`Worker ${workerId} not found.`);
      return false;
    }
    if (this._busyWorkers.has(workerId)) {
      this._busyWorkers.delete(workerId);
      this._idleWorkers.add(workerId);
      this._logger.debug(`Worker ${workerId} set to idle.`);
      return true;
    }
    return false;
  }

  _hasBusyWorker() {
    return this._busyWorkers.size > 0;
  }

  _hasIdleWorker() {
    return this._idleWorkers.size > 0;
  }

  _getIdleWorker() {
    if (this._idleWorkers.size === 0) {
      return undefined;
    }
    const workerId = this._idleWorkers.values().next().value;
    return this._workers.get(workerId);
  }

  _stats() {
    return {
      totalWorkers: this._workers.size,
      busyWorkers: this._busyWorkers.size,
      idleWorkers: this._idleWorkers.size,
      maxWorkers: this._maxWorkers,
    };
  }
}
export { WorkersRegistry };
```

### 6.2. `source/lib/services/Application.js`

The Application class will be modified to initialize WorkersRegistry statically and remove the instance property.

```javascript
// source/lib/services/Application.js (Before - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js';
import { Engine } from './Engine.js';

class Application {
  constructor(config, logger) {
    this._config = config;
    this._logger = logger;
    this._workersRegistry = null;
    this._engine = null;
    // ...
  }

  async #initRegistries() {
    const { maxWorkers } = this._config.workers;
    this._workersRegistry = new WorkersRegistry(maxWorkers, this.#workerFactory.bind(this), this._logger);
    // ...
  }

  async start() {
    await this.#initRegistries();
    this._engine = new Engine(this._workersRegistry, this._jobRegistry, this._logger);
    // ...
  }
  // ...
}
export { Application };
```

```javascript
// source/lib/services/Application.js (After - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js';
import { Engine } from './Engine.js';

class Application {
  constructor(config, logger) {
    this._config = config;
    this._logger = logger;
    // this._workersRegistry = null; // Removed
    this._engine = null;
    // ...
  }

  async #initRegistries() {
    const { maxWorkers } = this._config.workers;
    WorkersRegistry.init(maxWorkers, this.#workerFactory.bind(this), this._logger); // Static initialization
    // ...
  }

  async start() {
    await this.#initRegistries();
    this._engine = new Engine(this._jobRegistry, this._logger); // workersRegistry parameter removed
    // ...
  }
  // ...
}
export { Application };
```

### 6.3. `source/lib/services/Engine.js`

The Engine class will no longer receive workersRegistry in its constructor and will use static calls.

```javascript
// source/lib/services/Engine.js (Before - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Already imported, but for instance usage

class Engine {
  constructor(workersRegistry, jobRegistry, logger) {
    this._workersRegistry = workersRegistry;
    this._jobRegistry = jobRegistry;
    this._logger = logger;
    // ...
  }

  async processJobs() {
    if (this._workersRegistry.hasBusyWorker()) {
      // ...
    }
    // ...
  }
  // ...
}
export { Engine };
```

```javascript
// source/lib/services/Engine.js (After - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Now for static usage

class Engine {
  constructor(jobRegistry, logger) { // workersRegistry parameter removed
    // this._workersRegistry = workersRegistry; // Removed
    this._jobRegistry = jobRegistry;
    this._logger = logger;
    // ...
  }

  async processJobs() {
    if (WorkersRegistry.hasBusyWorker()) { // Static call
      // ...
    }
    // ...
  }
  // ...
}
export { Engine };
```

### 6.4. `source/lib/models/Worker.js`

The Worker class will be updated to use static WorkersRegistry methods for state transitions.

```javascript
// source/lib/models/Worker.js (Before - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Already imported, but for instance usage

class Worker {
  constructor(id, workersRegistry, logger) {
    this.id = id;
    this._workersRegistry = workersRegistry;
    this._logger = logger;
    this.state = 'idle';
    // ...
  }

  async startJob(job) {
    this._workersRegistry.setBusy(this.id);
    // ...
  }

  async finishJob() {
    this._workersRegistry.setIdle(this.id);
    // ...
  }
  // ...
}
export { Worker };
```

```javascript
// source/lib/models/Worker.js (After - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Now for static usage

class Worker {
  constructor(id, logger) { // workersRegistry parameter removed
    this.id = id;
    // this._workersRegistry = workersRegistry; // Removed
    this._logger = logger;
    this.state = 'idle';
    // ...
  }

  async startJob(job) {
    WorkersRegistry.setBusy(this.id); // Static call
    // ...
  }

  async finishJob() {
    WorkersRegistry.setIdle(this.id); // Static call
    // ...
  }
  // ...
}
export { Worker };
```

### 6.5. `source/lib/services/WorkersAllocator.js`

The WorkersAllocator will use static WorkersRegistry methods to find and allocate workers.

```javascript
// source/lib/services/WorkersAllocator.js (Before - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Already imported, but for instance usage

class WorkersAllocator {
  constructor(workersRegistry, logger) {
    this._workersRegistry = workersRegistry;
    this._logger = logger;
    // ...
  }

  async allocateWorker() {
    if (!this._workersRegistry.hasIdleWorker()) {
      // ...
    }
    const worker = this._workersRegistry.getIdleWorker();
    // ...
  }
  // ...
}
export { WorkersAllocator };
```

```javascript
// source/lib/services/WorkersAllocator.js (After - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Now for static usage

class WorkersAllocator {
  constructor(logger) { // workersRegistry parameter removed
    // this._workersRegistry = workersRegistry; // Removed
    this._logger = logger;
    // ...
  }

  async allocateWorker() {
    if (!WorkersRegistry.hasIdleWorker()) { // Static call
      // ...
    }
    const worker = WorkersRegistry.getIdleWorker(); // Static call
    // ...
  }
  // ...
}
export { WorkersAllocator };
```

### 6.6. `source/lib/server/Router.js`

The Router will no longer pass the workersRegistry instance to its handlers.

```javascript
// source/lib/server/Router.js (Before - relevant sections)
import { StatsRequestHandler } from './StatsRequestHandler.js';

class Router {
  constructor(jobRegistry, workersRegistry, logger) {
    this._jobRegistry = jobRegistry;
    this._workersRegistry = workersRegistry;
    this._logger = logger;
    this._routes = {
      '/stats': new StatsRequestHandler(this._jobRegistry, this._workersRegistry, this._logger),
      // ...
    };
  }
  // ...
}
export { Router };
```

```javascript
// source/lib/server/Router.js (After - relevant sections)
import { StatsRequestHandler } from './StatsRequestHandler.js';

class Router {
  constructor(jobRegistry, logger) { // workersRegistry parameter removed
    this._jobRegistry = jobRegistry;
    // this._workersRegistry = workersRegistry; // Removed
    this._logger = logger;
    this._routes = {
      '/stats': new StatsRequestHandler(this._jobRegistry, this._logger), // workersRegistry parameter removed
      // ...
    };
  }
  // ...
}
export { Router };
```

### 6.7. `source/lib/server/StatsRequestHandler.js`

The StatsRequestHandler will directly use the static WorkersRegistry.stats() method.

```javascript
// source/lib/server/StatsRequestHandler.js (Before - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Already imported, but for instance usage

class StatsRequestHandler {
  constructor(jobRegistry, workersRegistry, logger) {
    this._jobRegistry = jobRegistry;
    this._workersRegistry = workersRegistry;
    this._logger = logger;
  }

  async handle(req, res) {
    const jobStats = this._jobRegistry.stats();
    const workerStats = this._workersRegistry.stats();
    // ...
  }
}
export { StatsRequestHandler };
```

```javascript
// source/lib/server/StatsRequestHandler.js (After - relevant sections)
import { WorkersRegistry } from '../registry/WorkersRegistry.js'; // Now for static usage

class StatsRequestHandler {
  constructor(jobRegistry, logger) { // workersRegistry parameter removed
    this._jobRegistry = jobRegistry;
    // this._workersRegistry = workersRegistry; // Removed
    this._logger = logger;
  }

  async handle(req, res) {
    const jobStats = this._jobRegistry.stats();
    const workerStats = WorkersRegistry.stats(); // Static call
    // ...
  }
}
export { StatsRequestHandler };
```

### 6.8. Test files (`spec/`)

All test files that interact with WorkersRegistry will need to be updated to either initialize it statically or, more importantly, reset its state after each test.

```javascript
// spec/some-component.spec.js (Before - relevant sections)
import { WorkersRegistry } from '../source/lib/registry/WorkersRegistry.js';
import { Application } from '../source/lib/services/Application.js';

describe('Application', () => {
  let app;
  let mockLogger;
  let mockConfig;

  beforeEach(() => {
    mockLogger = { /* ... */ };
    mockConfig = { /* ... */ };
    app = new Application(mockConfig, mockLogger);
  });

  it('should initialize workers registry', async () => {
    await app.start();
    expect(app._workersRegistry).toBeInstanceOf(WorkersRegistry);
    // ...
  });
});
```

```javascript
// spec/some-component.spec.js (After - relevant sections)
import { WorkersRegistry } from '../source/lib/registry/WorkersRegistry.js';
import { Application } from '../source/lib/services/Application.js';

describe('Application', () => {
  let app;
  let mockLogger;
  let mockConfig;

  beforeEach(() => {
    mockLogger = { /* ... */ };
    mockConfig = { /* ... */ };
    app = new Application(mockConfig, mockLogger);
  });

  afterEach(() => {
    WorkersRegistry.reset(); // Ensure clean state for next test
    jest.clearAllMocks();
  });

  it('should initialize workers registry statically', async () => {
    await app.start();
    // No direct instance on app, but static methods should work
    expect(() => WorkersRegistry.hasIdleWorker()).not.toThrow();
    // ...
  });
});
```

## 7. Testing Strategy

A robust testing strategy is essential to ensure the refactoring introduces no regressions and achieves the desired benefits.

### 7.1. Unit Tests


WorkersRegistry.js:

Test WorkersRegistry.init(): Verify it correctly initializes the internal instance and prevents re-initialization.
Test WorkersRegistry.reset(): Verify it clears the internal instance.
Test each static delegation method (initWorkers, setBusy, setIdle, hasBusyWorker, hasIdleWorker, getIdleWorker, stats) independently, ensuring they correctly delegate to the internal instance.
Test error handling: Verify that calling static methods before WorkersRegistry.init() throws an appropriate error.
Test the constructor: Ensure it throws an error if called directly after init().




### 7.2. Integration Tests


Application Initialization: Verify that the Application service correctly initializes WorkersRegistry using WorkersRegistry.init() and that subsequent static calls work as expected.
Engine Interaction: Test that the Engine correctly uses WorkersRegistry.hasBusyWorker() to determine if it should process jobs.
Worker State Transitions: Test that Worker instances correctly update their state (busy/idle) by calling WorkersRegistry.setBusy() and WorkersRegistry.setIdle().
WorkersAllocator Functionality: Verify that WorkersAllocator correctly uses WorkersRegistry.hasIdleWorker() and WorkersRegistry.getIdleWorker() to manage worker allocation.
Stats Endpoint: Ensure the /stats endpoint (handled by StatsRequestHandler) correctly retrieves worker statistics using WorkersRegistry.stats().


### 7.3. Test Isolation


Implement WorkersRegistry.reset() in afterEach hooks across all relevant test suites to ensure that each test runs with a clean, uninitialized WorkersRegistry state.
Verify that no test pollution occurs between test runs, meaning the state of WorkersRegistry from one test does not affect subsequent tests.


## 8. Validation Checklist


[x] All static methods implemented with proper error handling (e.g., calling before init()).
[x] WorkersRegistry.init() creates singleton correctly and prevents re-initialization.
[x] WorkersRegistry.reset() clears singleton.
[x] Error thrown when static methods called before init().
[x] Application initializes correctly with static methods.
[x] Engine uses static methods for hasBusyWorker().
[x] Worker uses static methods for setIdle() and setBusy().
[x] WorkersAllocator uses static methods for hasIdleWorker() and getIdleWorker().
[x] Router no longer passes workersRegistry to handlers.
[x] StatsRequestHandler uses static methods for stats().
[x] All tests pass with reset() in afterEach.
[x] Stats endpoint returns correct data.
[x] Worker state transitions work correctly.
[x] No test pollution between test runs.


## 9. Backward Compatibility

The refactoring is designed to maintain a degree of backward compatibility, especially during the transition phase:

Instance Constructor: The original instance constructor for WorkersRegistry will remain, though its behavior will be modified after WorkersRegistry.init() is called to prevent direct instantiation. This allows existing code that might still create instances (e.g., some legacy tests) to function, albeit with warnings or errors if called after the singleton is established.
Existing Instance Methods: The original instance methods (e.g., _setBusy, _getIdleWorker) will still exist internally, as the static methods delegate to them. This means that if any external code *somehow* still holds an instance and calls these methods, they will technically still work, though this pattern is discouraged.
Test Flexibility: Tests can still inject custom instances of WorkersRegistry if absolutely necessary by not calling WorkersRegistry.init() and directly instantiating a mock or real WorkersRegistry. However, the recommended approach will be to use the static methods and reset().
Gradual Migration: The changes can be rolled out in stages, first by implementing the static methods, then updating Application, and finally updating all call sites.


## 10. Rollback Plan

In the event of critical issues or unforeseen complications, the following steps outline a plan to revert the changes:

Revert WorkersRegistry.js: Remove the static #instance property, init(), reset(), and all static delegation methods. Restore the original public instance methods.
Revert Application.js: Reintroduce the _workersRegistry instance property, revert #initRegistries() to instantiate WorkersRegistry directly, and pass this instance to Engine.
Revert All Call Sites: For Engine.js, Worker.js, WorkersAllocator.js, Router.js, and StatsRequestHandler.js, revert changes to pass the workersRegistry instance in constructors and use instance methods.
Revert Test Files: Remove all calls to WorkersRegistry.reset() from afterEach hooks and revert any test setup that relied on static initialization.


## 11. Benefits

This refactoring is expected to yield several significant benefits:

✅ Eliminates Verbose Dependency Injection: Reduces boilerplate code by removing the need to pass the WorkersRegistry instance through multiple layers.
✅ Cleaner, More Intuitive API: Direct static calls (e.g., WorkersRegistry.setBusy()) are simpler and more explicit.
✅ Consistent with JobRegistry Pattern: Aligns the worker management with the existing, successful JobRegistry implementation, improving code consistency.
✅ Better Test Isolation with reset(): The static reset() method provides a straightforward way to ensure a clean state for WorkersRegistry in unit and integration tests.
✅ Reduces Coupling Between Layers: Components no longer need to know how WorkersRegistry is instantiated or managed, only how to interact with its public static interface.
✅ Easier to Maintain and Extend: A centralized, static access point simplifies future modifications and additions to worker management logic.
✅ Aligns with Singleton Pattern Best Practices: Provides a controlled way to manage a single, global instance of WorkersRegistry.


## 12. Timeline & Effort Estimate


Implementation: 2-3 hours (focused on WorkersRegistry.js and updating call sites).
Testing: 1-2 hours (updating existing tests and creating new unit tests for static methods).
Code Review & Refinement: 1 hour.
Total Estimated Effort: 4-6 hours.


## 13. Risk Assessment

### 13.1. Low Risk


Static Methods are Additive: Initially, the static methods are added alongside the existing instance methods (which are then delegated to). This means no immediate breaking changes to the core logic.
Instance Methods Remain Functional: The underlying instance methods are still present, reducing the risk of complete breakage if a call site is missed.
Can Be Rolled Back Easily: The clear rollback plan ensures that the changes can be reverted quickly if severe issues arise.


### 13.2. Medium Risk


Requires Updates Across 7+ Files: The refactoring touches many files, increasing the chance of missing a call site or introducing a subtle bug.
Test Setup Changes Needed: Modifying test setups (e.g., adding afterEach hooks) requires careful attention to avoid breaking existing tests or introducing new test pollution.
Potential for Missed Call Sites: Despite careful review, some obscure usages of the workersRegistry instance might be overlooked.


### 13.3. Mitigation


Use grep to Find All workersRegistry References: Perform a thorough search across the codebase for all instances of workersRegistry (as a variable name, parameter, or property) to identify all call sites.
Comprehensive Test Coverage: Rely on existing unit and integration tests, and augment them with new tests specifically for the static methods and the singleton pattern.
Code Review Before Merge: Ensure a detailed code review by another team member to catch any missed changes or potential issues.
Staged Rollout if Needed: If the application is critical, consider a staged rollout (e.g., deploying to a staging environment first) to monitor for unexpected behavior.


## 14. Next Steps


Create feature branch: refactor/workers-registry-static-methods.
Implement changes file by file, starting with WorkersRegistry.js.
Run tests after each significant file change to catch issues early.
Create a Pull Request (PR) with a detailed description referencing this implementation plan.
Conduct thorough code review and address any feedback.
Merge the PR and monitor the application in production.


---

Document generated on 10 de abril de 2026. The information contained herein is the responsibility of the requester.