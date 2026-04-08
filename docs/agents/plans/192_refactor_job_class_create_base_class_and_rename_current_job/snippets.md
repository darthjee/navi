# Code Snippets

## `source/lib/models/Job.js` (refactored base class)

```javascript
import { Logger } from '../utils/Logger.js';

/**
 * Job is the abstract base class for all units of work processed by a Worker.
 * Subclasses must implement the `perform` method.
 * @author darthjee
 */
class Job {
  #attempts;
  #readyBy;

  /**
   * Creates a new Job instance.
   * @param {object} params - The parameters for creating a Job instance.
   * @param {string} params.id - The unique identifier for this job.
   */
  constructor({ id }) {
    this.id = id;
    this.#attempts = 0;
    this.#readyBy = 0;
  }

  /**
   * Performs the job. Must be overridden by subclasses.
   * @throws {Error} Always throws — subclasses must implement this method.
   * @returns {Promise}
   */
  async perform() {
    throw new Error('You must implement the perform method in a subclass');
  }

  /**
   * Returns the timestamp after which the job is eligible for retry.
   * @returns {number} The readyBy timestamp in milliseconds.
   */
  get readyBy() {
    return this.#readyBy;
  }

  /**
   * Sets the cooldown duration in milliseconds after which the job is eligible for retry.
   * Stores the absolute timestamp (Date.now() + ms) internally.
   * @param {number} ms - Cooldown duration in milliseconds. Use a negative value to mark ready immediately.
   */
  applyCooldown(ms) {
    this.#readyBy = Date.now() + ms;
  }

  /**
   * Checks whether the job's cooldown period has elapsed relative to the given time.
   * @param {number} currentTime - The current timestamp in milliseconds.
   * @returns {boolean} True if the job can be retried at the given time.
   */
  isReadyBy(currentTime) {
    return currentTime >= this.#readyBy;
  }

  /**
   * Checks if the job has been exhausted (i.e., has reached the maximum number of attempts).
   * @returns {boolean} True if the job is exhausted, false otherwise.
   */
  exhausted() {
    return this.#attempts >= 3;
  }

  /**
   * Handles a failed job attempt.
   * @param {Error} error - The error that caused the job to fail.
   * @protected
   */
  _fail(error) {
    this.#attempts += 1;
    this.lastError = error;
    throw error;
  }
}

export { Job };
```

---

## `source/lib/models/ResourceRequestJob.js` (new file)

```javascript
import { Logger } from '../utils/Logger.js';
import { Job } from './Job.js';

/**
 * ResourceRequestJob is a Job that performs an HTTP request for a ResourceRequest.
 * @author darthjee
 */
class ResourceRequestJob extends Job {
  #resourceRequest;
  #parameters;
  #clients;
  #client;

  /**
   * Creates a new ResourceRequestJob instance.
   * @param {object} params - The parameters for creating a ResourceRequestJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {ResourceRequest} params.resourceRequest - The resource request associated with this job.
   * @param {object} params.parameters - Additional parameters for the request.
   * @param {ClientRegistry} params.clients - Clients registry to be used in a request.
   */
  constructor({ id, resourceRequest, parameters, clients }) {
    super({ id });
    this.#resourceRequest = resourceRequest;
    this.#parameters = parameters;
    this.#clients = clients;
  }

  /**
   * Performs the HTTP request for the resource request.
   * @returns {Promise} A promise that resolves with the HTTP response.
   */
  async perform() {
    Logger.info(`Job #${this.id} performing`);
    try {
      this.lastError = undefined;
      const response = await this.#getClient().perform(this.#resourceRequest);
      this.#resourceRequest.executeActions(response.data);
      return response;
    } catch (error) {
      Logger.error(`Job #${this.id} failed: ${error}`);
      this._fail(error);
    }
  }

  /**
   * Gets the client associated with this job's resource request.
   * @returns {Client} The client associated with this job's resource request.
   * @private
   */
  #getClient() {
    if (!this.#client) {
      this.#client = this.#clients.getClient(this.#resourceRequest.clientName);
    }
    return this.#client;
  }
}

export { ResourceRequestJob };
```

---

## `source/lib/factories/JobFactory.js` (refactored)

```javascript
import { Factory } from './Factory.js';
import { ResourceRequestJob } from '../models/ResourceRequestJob.js';
import { IdGenerator } from '../utils/IdGenerator.js';

/**
 * JobFactory is responsible for creating Job instances with unique identifiers.
 * Constructor-time attributes are merged with build-time params on every build call.
 * @author darthjee
 */
class JobFactory extends Factory {
  #attributes;

  /**
   * Creates a new JobFactory instance.
   * @param {object} options - Configuration options for the factory.
   * @param {class} options.klass - The class to instantiate (default is ResourceRequestJob).
   * @param {object} options.attributesGenerator - The generator for unique attributes (default is IdGenerator).
   * @param {object} options.attributes - Attributes injected into every built instance (e.g. { clients }).
   */
  constructor({ klass = ResourceRequestJob, attributesGenerator = new IdGenerator(), attributes = {} } = {}) {
    super({ klass, attributesGenerator });
    this.#attributes = attributes;
  }

  /**
   * Builds a new Job instance, merging constructor-level attributes with the given params.
   * @param {object} params - The parameters for building a Job instance.
   * @param {ResourceRequest} params.resourceRequest - The resource request associated with the Job.
   * @param {object} params.parameters - Additional parameters for the Job.
   * @returns {Job} A new Job instance.
   * @override
   */
  build(params) {
    return super.build({ ...this.#attributes, ...params });
  }
}

export { JobFactory };
```

---

## `source/lib/registry/JobRegistry.js` (changed line only)

```javascript
// before
this.#factory = factory || new JobFactory({ clients });

// after
this.#factory = factory || new JobFactory({ attributes: { clients } });
```
