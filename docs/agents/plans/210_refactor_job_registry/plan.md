Navi Project

Implementation Plan: Refactor JobRegistry to Singleton Pattern with Static Delegation

A surgical approach to enhance JobRegistry accessibility and reduce coupling

10 de abril de 2026

---

### 1. Current Context

The `JobRegistry` class in the Navi project is currently instantiated and passed as a dependency to various parts of the application. Based on the provided code, the typical flow is:

*   The `Application` service creates an instance of `JobRegistry`.
*   This `jobRegistry` instance is then passed to `WorkersRegistry`.
*   `WorkersRegistry` further passes it to `WorkerFactory.build()`.
*   Individual `Worker` instances receive `jobRegistry` in their constructors.
*   `ResourceRequestJob` also receives `jobRegistry` in its constructor, which is then used by `enqueueActions`.

**Example Dependency Chain:**

Application
  ├─ jobRegistry = new JobRegistry({ cooldown })  // Instance created here
  ├─ workersRegistry = new WorkersRegistry({ jobRegistry })  // Passed here
  │   └─ WorkerFactory.build({ jobRegistry })  // Passed to factory
  │       └─ Worker({ jobRegistry, workerRegistry })  // Injected into constructor
  │
  └─ ResourceRequestJob({ jobRegistry })  // Injected into build method

### 2. The Problem

This pattern of passing the `JobRegistry` instance through multiple layers of the application leads to:

*   **Tight Coupling:** Components become tightly coupled to the `JobRegistry` instance, requiring it to be threaded through constructors and method signatures even when not directly used by an intermediate component.
*   **Boilerplate Code:** Excessive constructor parameters and property assignments for `jobRegistry` across multiple classes.
*   **Reduced Readability:** The core logic can be obscured by dependency management.
*   **Testing Challenges:** While dependency injection is good for testing, the pervasive passing of a global-like service can make setup more complex than necessary for unit tests that don't directly interact with the registry.

The goal is to simplify access to `JobRegistry` methods, making it a globally accessible service without sacrificing testability.

### 3. Implementation Plan

The refactoring will be executed in 5 surgical steps to minimize disruption and ensure a smooth transition. The core idea is to transform `JobRegistry` into a singleton accessible via static methods, while retaining an internal instance for state management.

#### 3.1. Step 1: Create the Static Singleton Wrapper for JobRegistry
Rename the existing `JobRegistry` class to `JobRegistryInstance` and create a new `JobRegistry` class that acts as a static wrapper, managing the singleton instance and delegating calls.

#### 3.2. Step 2: Update Application.js to Call `JobRegistry.build()`
Modify the `Application` service to be responsible for initializing the `JobRegistry` singleton using the new `JobRegistry.build()` static method.

#### 3.3. Step 3: Update Worker.js to Use Static JobRegistry Methods
Refactor the `Worker` class to directly call the static `JobRegistry.finish()` and `JobRegistry.fail()` methods, removing the need to inject `jobRegistry` into its constructor.

#### 3.4. Step 4: Update ResourceRequestJob.js to Use Static JobRegistry Methods
Modify `ResourceRequestJob` to use the static `JobRegistry` when enqueueing actions, removing `jobRegistry` from its constructor.

#### 3.5. Step 5: Update Application.js `enqueueFirstJobs()` to Use Static JobRegistry Methods
Adjust the `enqueueFirstJobs()` method in `Application.js` to use the static `JobRegistry.enqueue()` method.

### 4. Step-by-Step Instructions

#### 4.1. Step 1: Create the Static Singleton Wrapper for JobRegistry

**File:** `source/lib/registry/JobRegistry.js`

**Changes:**
1.  Rename the existing `JobRegistry` class to `JobRegistryInstance`.
2.  Create a new `JobRegistry` class that will serve as the static wrapper.
3.  Implement `static #instance` to hold the singleton.
4.  Add `static build()` for initial setup.
5.  Add `static #getInstance()` for internal access.
6.  Add `static reset()` for testing purposes.
7.  Implement static delegation methods for `enqueue`, `fail`, `finish`, `pick`, `promoteReadyJobs`, `hasReadyJob`, `hasJob`, and `stats`.

```javascript
// source/lib/registry/JobRegistry.js

/**
 * @class JobRegistry
 * @description Static wrapper for the JobRegistryInstance, implementing a singleton pattern
 *              with static method delegation.
 */
class JobRegistry {
  /**
   * @private
   * @static
   * @type {JobRegistryInstance|null}
   * @description Holds the single instance of JobRegistryInstance.
   */
  static #instance = null;

  /**
   * @static
   * @param {object} [options={}] - Options to pass to the JobRegistryInstance constructor.
   * @returns {JobRegistryInstance} The singleton instance of JobRegistryInstance.
   * @throws {Error} If JobRegistry.build() has already been called.
   * @description Initializes and stores the singleton instance of JobRegistryInstance.
   *              This method should be called exactly once during application bootstrap.
   */
  static build(options = {}) {
    if (JobRegistry.#instance) {
      throw new Error('JobRegistry.build() has already been called. Use JobRegistry.instance() to access it.');
    }
    JobRegistry.#instance = new JobRegistryInstance(options);
    console.log('[JobRegistry] Singleton instance built.');
    return JobRegistry.#instance;
  }

  /**
   * @private
   * @static
   * @returns {JobRegistryInstance} The singleton instance of JobRegistryInstance.
   * @throws {Error} If JobRegistry.build() has not been called yet.
   * @description Retrieves the stored singleton instance. This method is intended for
   *              internal use by the static delegation methods.
   */
  static #getInstance() {
    if (!JobRegistry.#instance) {
      throw new Error('JobRegistry has not been built. Call JobRegistry.build() first during application bootstrap.');
    }
    return JobRegistry.#instance;
  }

  /**
   * @static
   * @returns {void}
   * @description Resets the singleton instance. This method is primarily for testing
   *              purposes to ensure isolation between test runs.
   */
  static reset() {
    JobRegistry.#instance = null;
    console.log('[JobRegistry] Singleton instance reset.');
  }

  // ===== STATIC DELEGATION METHODS =====

  /**
   * @static
   * @param {string} factoryKey - The key of the job factory.
   * @param {object} [params={}] - Parameters for the job.
   * @returns {Job} The enqueued job.
   * @description Delegates the call to the enqueue method of the JobRegistryInstance.
   */
  static enqueue(factoryKey, params = {}) {
    return JobRegistry.#getInstance().enqueue(factoryKey, params);
  }

  /**
   * @static
   * @param {Job} job - The job to mark as failed.
   * @returns {void}
   * @description Delegates the call to the fail method of the JobRegistryInstance.
   */
  static fail(job) {
    return JobRegistry.#getInstance().fail(job);
  }

  /**
   * @static
   * @param {Job} job - The job to mark as finished.
   * @returns {void}
   * @description Delegates the call to the finish method of the JobRegistryInstance.
   */
  static finish(job) {
    return JobRegistry.#getInstance().finish(job);
  }

  /**
   * @static
   * @returns {Job|undefined} A ready job, or undefined if none are available.
   * @description Delegates the call to the pick method of the JobRegistryInstance.
   */
  static pick() {
    return JobRegistry.#getInstance().pick();
  }

  /**
   * @static
   * @returns {void}
   * @description Delegates the call to the promoteReadyJobs method of the JobRegistryInstance.
   */
  static promoteReadyJobs() {
    return JobRegistry.#getInstance().promoteReadyJobs();
  }

  /**
   * @static
   * @returns {boolean} True if there is at least one job ready to be picked.
   * @description Delegates the call to the hasReadyJob method of the JobRegistryInstance.
   */
  static hasReadyJob() {
    return JobRegistry.#getInstance().hasReadyJob();
  }

  /**
   * @static
   * @returns {boolean} True if there are any jobs (ready, pending, or in progress).
   * @description Delegates the call to the hasJob method of the JobRegistryInstance.
   */
  static hasJob() {
    return JobRegistry.#getInstance().hasJob();
  }

  /**
   * @static
   * @returns {object} Statistics about the job registry.
   * @description Delegates the call to the stats method of the JobRegistryInstance.
   */
  static stats() {
    return JobRegistry.#getInstance().stats();
  }

  // Note: Methods like lock() and hasLock() will be audited.
  // If confirmed unused, they should be removed from JobRegistryInstance.
  // If used, static delegation methods should be added here.
}

/**
 * @class JobRegistryInstance
 * @description The original JobRegistry class, now renamed to be the actual instance
 *              managed by the static JobRegistry wrapper.
 */
class JobRegistryInstance {
  // ... ALL EXISTING CODE OF THE ORIGINAL JobRegistry CLASS GOES HERE ...
  // Example:
  #cooldown;
  #jobs = new Map();
  #readyJobs = [];
  #inProgressJobs = new Map();
  #failedJobs = [];
  #finishedJobs = [];

  constructor({ cooldown }) {
    this.#cooldown = cooldown;
    // ... rest of original constructor logic ...
  }

  enqueue(factoryKey, params = {}) {
    // ... original enqueue logic ...
    const job = { id: Date.now(), factoryKey, params, status: 'pending' }; // Simplified
    this.#jobs.set(job.id, job);
    this.#readyJobs.push(job);
    return job;
  }

  fail(job) {
    // ... original fail logic ...
    job.status = 'failed';
    this.#failedJobs.push(job);
    this.#inProgressJobs.delete(job.id);
  }

  finish(job) {
    // ... original finish logic ...
    job.status = 'finished';
    this.#finishedJobs.push(job);
    this.#inProgressJobs.delete(job.id);
  }

  pick() {
    // ... original pick logic ...
    if (this.#readyJobs.length > 0) {
      const job = this.#readyJobs.shift();
      job.status = 'in_progress';
      this.#inProgressJobs.set(job.id, job);
      return job;
    }
    return undefined;
  }

  promoteReadyJobs() {
    // ... original promoteReadyJobs logic ...
  }

  hasReadyJob() {
    return this.#readyJobs.length > 0;
  }

  hasJob() {
    return this.#jobs.size > 0;
  }

  stats() {
    return {
      total: this.#jobs.size,
      ready: this.#readyJobs.length,
      inProgress: this.#inProgressJobs.size,
      failed: this.#failedJobs.length,
      finished: this.#finishedJobs.length,
    };
  }

  // lock() and hasLock() - To be removed if audit confirms they are unused.
  // If used, their logic should remain here, and static delegation added to JobRegistry.
}

export { JobRegistry, JobRegistryInstance };
```

#### 4.2. Step 2: Update Application.js to Call `JobRegistry.build()`

**File:** `source/lib/services/Application.js`

**Changes:**
1.  Import the new `JobRegistry` class.
2.  Modify the `#initRegistries` method to use `JobRegistry.build()` for initialization. The `jobRegistry ||` part is kept to allow dependency injection for testing purposes.

```javascript
// source/lib/services/Application.js

import { JobRegistry } from '../registry/JobRegistry.js'; // Ensure this import is present

class Application {
  // ... existing code ...

  /**
   * @private
   * @param {object} [options={}] - Options for initialization.
   * @param {JobRegistryInstance} [options.jobRegistry] - Optional JobRegistry instance for testing.
   * @param {WorkersRegistry} [options.workersRegistry] - Optional WorkersRegistry instance for testing.
   * @returns {void}
   * @description Initializes the job and worker registries.
   */
  #initRegistries({ jobRegistry, workersRegistry } = {}) {
    // Existing JobFactory builds
    JobFactory.build('ResourceRequestJob', { attributes: { clients: this.config.clientRegistry } });
    JobFactory.build('Action', { klass: ActionProcessingJob });

    // ✅ MODIFIED: Initialize JobRegistry using the static build method.
    // The 'jobRegistry ||' part allows injecting a mock instance for testing.
    this.jobRegistry = jobRegistry || JobRegistry.build({
      cooldown: this.config.workersConfig.retryCooldown,
    });

    this.workersRegistry = workersRegistry || new WorkersRegistry({
      jobRegistry: this.jobRegistry, // Keep passing for WorkersRegistry's internal use/testing
      workers: this.#workers,
      ...this.config.workersConfig
    });
    this.workersRegistry.initWorkers();
  }

  // ... rest of the class ...
}
```

#### 4.3. Step 3: Update Worker.js to Use Static JobRegistry Methods

**File:** `source/lib/models/Worker.js`

**Changes:**
1.  Import the new `JobRegistry` class.
2.  Remove `jobRegistry` from the constructor parameters and the `this.jobRegistry` assignment.
3.  Update calls to `this.jobRegistry.finish()` and `this.jobRegistry.fail()` to `JobRegistry.finish()` and `JobRegistry.fail()`.

```javascript
// source/lib/models/Worker.js

import { JobRegistry } from '../registry/JobRegistry.js'; // Ensure this import is present
import ConsoleLogger from '../utils/ConsoleLogger.js'; // Assuming this is the logger

/**
 * @class Worker
 * @description Represents a worker that performs jobs from the JobRegistry.
 */
class Worker {
  #logger;
  #workerRegistry; // Keep this for its own logic
  job; // The current job being processed

  /**
   * @param {object} options - Worker options.
   * @param {string} options.id - Unique ID of the worker.
   * @param {WorkersRegistry} options.workerRegistry - The WorkersRegistry instance.
   * @description Constructor for the Worker class.
   */
  constructor({ id, workerRegistry }) { // ✅ MODIFIED: Removed jobRegistry from constructor
    this.id = id;
    this.#workerRegistry = workerRegistry;
    this.#logger = new ConsoleLogger();
  }

  /**
   * @async
   * @returns {Promise}
   * @description Performs the assigned job, handles success or failure, and updates the JobRegistry.
   * @throws {Error} If no job is assigned to the worker.
   */
  async perform() {
    if (!this.job) {
      throw new Error('No job assigned to worker');
    }
    try {
      await this.job.perform();
      JobRegistry.finish(this.job); // ✅ MODIFIED: Use static JobRegistry.finish()
    } catch (error) {
      this.#logger.error(`Error occurred while performing job: #${this.job.id} - ${error}`);
      JobRegistry.fail(this.job); // ✅ MODIFIED: Use static JobRegistry.fail()
    } finally {
      this.job = undefined;
      this.#workerRegistry.setIdle(this.id);
    }
  }

  // ... rest of the class ...
}

export default Worker;
```

#### 4.4. Step 4: Update ResourceRequestJob.js to Use Static JobRegistry Methods

**File:** `source/lib/models/ResourceRequestJob.js`

**Changes:**
1.  Import the new `JobRegistry` class.
2.  Remove `jobRegistry` from the constructor parameters and the `#jobRegistry` private field.
3.  Update the call to `this.#resourceRequest.enqueueActions()` to pass the static `JobRegistry` class instead of the instance.

```javascript
// source/lib/models/ResourceRequestJob.js

import { JobRegistry } from '../registry/JobRegistry.js'; // Ensure this import is present
import Job from './Job.js'; // Assuming Job is the base class
import Logger from '../utils/ConsoleLogger.js'; // Assuming this is the logger

/**
 * @class ResourceRequestJob
 * @extends Job
 * @description Represents a job for processing resource requests.
 */
class ResourceRequestJob extends Job {
  #resourceRequest;
  #parameters;
  #clients;
  // ✅ MODIFIED: Removed #jobRegistry private field

  /**
   * @param {object} options - Job options.
   * @param {string} options.id - Unique ID of the job.
   * @param {ResourceRequest} options.resourceRequest - The resource request to process.
   * @param {object} options.parameters - Parameters for the request.
   * @param {ClientRegistry} options.clients - The client registry.
   * @description Constructor for the ResourceRequestJob.
   */
  constructor({ id, resourceRequest, parameters, clients }) { // ✅ MODIFIED: Removed jobRegistry from constructor
    super({ id });
    this.#resourceRequest = resourceRequest;
    this.#parameters = parameters;
    this.#clients = clients;
    // ✅ MODIFIED: Removed assignment to #jobRegistry
  }

  /**
   * @async
   * @returns {Promise}
   * @description Performs the resource request and enqueues subsequent actions.
   */
  async perform() {
    Logger.info(`Job #${this.id} performing`);
    try {
      this.lastError = undefined;
      const response = await this.#getClient().perform(
        this.#resourceRequest,
        this.#parameters
      );
      // ✅ MODIFIED: Pass the static JobRegistry class
      this.#resourceRequest.enqueueActions(response, JobRegistry);
    } catch (error) {
      this._fail(error);
    }
  }

  // ... rest of the class, including #getClient() and _fail() ...
}

export default ResourceRequestJob;
```

#### 4.5. Step 5: Update Application.js `enqueueFirstJobs()` to Use Static JobRegistry Methods

**File:** `source/lib/services/Application.js`

**Changes:**
1.  Ensure `JobRegistry` is imported (already done in Step 2).
2.  Modify the `JobRegistry.enqueue()` call to remove the `jobRegistry` parameter from the job's `params` object, as it's no longer needed.

```javascript
// source/lib/services/Application.js

import { JobRegistry } from '../registry/JobRegistry.js'; // Ensure this import is present
import ResourceRequestCollector from '../models/ResourceRequestCollector.js'; // Assuming this import is present

class Application {
  // ... existing code ...

  /**
   * @description Enqueues the initial set of jobs based on resource requests.
   * @returns {void}
   */
  enqueueFirstJobs() {
    new ResourceRequestCollector(this.config.resourceRegistry)
      .requestsNeedingNoParams()
      .forEach((resourceRequest) => {
        // ✅ MODIFIED: Use static JobRegistry.enqueue() and remove jobRegistry from params
        JobRegistry.enqueue('ResourceRequestJob', {
          resourceRequest,
          parameters: {},
          // ✅ REMOVED: jobRegistry: this.jobRegistry, // No longer needed
        });
      });
  }

  // ... rest of the class ...
}
```

### 5. Implementation Checklist

*   [ ] **Refactor `JobRegistry.js`:**
    *   [ ] Rename `JobRegistry` to `JobRegistryInstance`.
    *   [ ] Create new `JobRegistry` class as the static wrapper.
    *   [ ] Implement `static #instance`, `static build()`, `static #getInstance()`, `static reset()`.
    *   [ ] Implement all static delegated methods (`enqueue`, `fail`, `finish`, `pick`, `promoteReadyJobs`, `hasReadyJob`, `hasJob`, `stats`).
    *   [ ] Export both `JobRegistry` and `JobRegistryInstance`.
*   [ ] **Update `Application.js` (`#initRegistries`):**
    *   [ ] Change `new JobRegistry(...)` to `JobRegistry.build(...)`.
*   [ ] **Update `Worker.js`:**
    *   [ ] Remove `jobRegistry` from constructor parameters.
    *   [ ] Remove `this.jobRegistry` assignment.
    *   [ ] Replace `this.jobRegistry.finish()` with `JobRegistry.finish()`.
    *   [ ] Replace `this.jobRegistry.fail()` with `JobRegistry.fail()`.
*   [ ] **Update `ResourceRequestJob.js`:**
    *   [ ] Remove `jobRegistry` from constructor parameters.
    *   [ ] Remove `#jobRegistry` private field.
    *   [ ] Replace `this.#resourceRequest.enqueueActions(response, this.#jobRegistry)` with `this.#resourceRequest.enqueueActions(response, JobRegistry)`.
*   [ ] **Update `Application.js` (`enqueueFirstJobs`):**
    *   [ ] Remove `jobRegistry: this.jobRegistry` from the `JobRegistry.enqueue` call's parameters.
*   [ ] **Audit `lock()` and `hasLock()` methods:**
    *   [ ] Run `grep -r -E "\.lock\(|\.hasLock\(" source/` to find usage.
    *   [ ] If no usage is found, remove these methods from `JobRegistryInstance`.
    *   [ ] If usage is found, implement static delegation for them in `JobRegistry` and update call sites.
*   [ ] **Update Tests:**
    *   [ ] For any test files that directly instantiate `JobRegistry` or inject it, update them to use `JobRegistry.build()` or `JobRegistry.reset()` as appropriate.
    *   [ ] Add `JobRegistry.reset()` to `beforeEach` or `afterEach` blocks in relevant Jasmine test suites to ensure test isolation.
    *   [ ] Remove `jobRegistry` injection from `Worker` and `ResourceRequestJob` constructors in tests where it's no longer needed.
*   [ ] **Code Review:** Ensure all changes align with project coding standards and functionality.

### 6. Minimal Impact Analysis

This plan is designed to be surgical, focusing only on the necessary changes.

*   **`WorkersRegistry`:** Will continue to receive `jobRegistry` in its constructor. This is acceptable as `WorkersRegistry` directly interacts with the `JobRegistryInstance` (e.g., `jobRegistry.pick()`, `jobRegistry.promoteReadyJobs()`). Keeping this as a dependency allows for easier testing of `WorkersRegistry` itself by injecting a mock `JobRegistryInstance`.
*   **`Engine`, `WorkersAllocator`:** These components likely interact with `jobRegistry` (e.g., `jobRegistry.pick()`, `jobRegistry.hasReadyJob()`). Their usage will remain largely unchanged, as they will continue to receive the `JobRegistryInstance` (via `WorkersRegistry` or direct injection if applicable).
*   **`WebServer`, `StatsRequestHandler`:** If these components receive `jobRegistry` as a parameter, they can continue to do so, or be updated to use `JobRegistry.stats()` directly if appropriate. The current plan does not force this change, allowing for incremental adoption.
*   **`ResourceRequest.enqueueActions()`:** This method currently takes `JobRegistry` as a parameter. The plan updates `ResourceRequestJob` to pass the static `JobRegistry` class. This is a minor change to the parameter type (instance vs. static class) and maintains the explicit dependency for `enqueueActions`.

### 7. Testing Strategy

Given that Navi uses Jasmine for testing, the key to maintaining testability with a singleton is the `JobRegistry.reset()` method.

*   **Unit Tests:**
    *   For tests that need a clean `JobRegistry` state, ensure `JobRegistry.reset()` is called in a `beforeEach` or `afterEach` block.
    *   Example:
        ```javascript
        // spec/lib/models/Worker.spec.js
        import { JobRegistry } from '../../../source/lib/registry/JobRegistry.js';
        import Worker from '../../../source/lib/models/Worker.js';
        import { JobRegistryInstance } from '../../../source/lib/registry/JobRegistry.js'; // For mocking

        describe('Worker', () => {
          let mockWorkerRegistry;

          beforeEach(() => {
            JobRegistry.reset(); // Ensure a clean slate for each test
            // Build a default instance if needed for tests that use static methods
            JobRegistry.build({ cooldown: 1000 });

            mockWorkerRegistry = jasmine.createSpyObj('WorkersRegistry', ['setIdle']);
          });

          it('should finish a job successfully', async () => {
            const worker = new Worker({ id: 'worker-1', workerRegistry: mockWorkerRegistry });
            const mockJob = { id: 'job-1', perform: async () => {}, status: 'in_progress' };
            worker.job = mockJob;

            spyOn(JobRegistry, 'finish').and.callThrough(); // Spy on the static method

            await worker.perform();

            expect(JobRegistry.finish).toHaveBeenCalledWith(mockJob);
            expect(mockWorkerRegistry.setIdle).toHaveBeenCalledWith('worker-1');
            expect(worker.job).toBeUndefined();
          });

          // ... other tests ...
        });
        ```
    *   For tests that need to mock `JobRegistry` behavior (e.g., testing `Application`'s interaction with `JobRegistry.build()`), you can still pass a mock `JobRegistryInstance` to `Application.#initRegistries()` as the `jobRegistry` parameter.
*   **Integration Tests:**
    *   Integration tests should primarily use the `JobRegistry.build()` and static methods as they would be used in production.
    *   Ensure `JobRegistry.reset()` is called before/after integration test suites to prevent state leakage.

### 8. Audit for `lock()` and `hasLock()`

To determine if the `lock()` and `hasLock()` methods of `JobRegistryInstance` are currently in use, execute the following command from the project root:

```bash
grep -r -E "\.lock\(|\.hasLock\(" source/
```

*   **If no results are found:** These methods are unused and should be removed from `JobRegistryInstance` to simplify the codebase.
*   **If results are found:**
    *   Analyze the usage to understand their purpose.
    *   Implement static delegation methods for `lock()` and `hasLock()` in the `JobRegistry` wrapper class.
    *   Update all call sites to use `JobRegistry.lock()` and `JobRegistry.hasLock()`.

### 9. Rollback Plan

In case of unforeseen issues or critical failures during or after the deployment of these changes, the following rollback procedure can be followed:

1.  **Revert Code Changes:**
    *   Revert the changes in `source/lib/registry/JobRegistry.js`:
        *   Rename `JobRegistryInstance` back to `JobRegistry`.
        *   Remove the static `JobRegistry` wrapper class entirely.
    *   Revert changes in `source/lib/services/Application.js`:
        *   Change `JobRegistry.build(...)` back to `new JobRegistry(...)`.
        *   Re-add `jobRegistry: this.jobRegistry` to `JobRegistry.enqueue` call parameters.
    *   Revert changes in `source/lib/models/Worker.js`:
        *   Re-add `jobRegistry` to the constructor and `this.jobRegistry` assignment.
        *   Change `JobRegistry.finish()` back to `this.jobRegistry.finish()`.
        *   Change `JobRegistry.fail()` back to `this.jobRegistry.fail()`.
    *   Revert changes in `source/lib/models/ResourceRequestJob.js`:
        *   Re-add `jobRegistry` to the constructor and `#jobRegistry` private field.
        *   Change `this.#resourceRequest.enqueueActions(response, JobRegistry)` back to `this.#resourceRequest.enqueueActions(response, this.#jobRegistry)`.
2.  **Revert Test Changes:** Revert any modifications made to test files related to `JobRegistry.reset()` or static method usage.
3.  **Redeploy:** Deploy the reverted codebase.
4.  **Monitor:** Closely monitor the application for stability.

### 10. Next Steps

1.  **Execute Audit:** Perform the `grep` command to audit `lock()` and `hasLock()` usage.
2.  **Implement Step 1:** Modify `source/lib/registry/JobRegistry.js` as described.
3.  **Implement Steps 2-5:** Apply the changes to `Application.js`, `Worker.js`, and `ResourceRequestJob.js`.
4.  **Update Tests:** Adjust existing Jasmine tests and add new ones to cover the static `JobRegistry` behavior and ensure `reset()` is used correctly.
5.  **Thorough Testing:** Conduct unit, integration, and end-to-end testing to validate the refactoring.
6.  **Code Review:** Submit changes for peer review.