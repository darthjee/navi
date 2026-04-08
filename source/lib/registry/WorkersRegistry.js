import { WorkerFactory } from '../factories/WorkerFactory.js';
import { IdentifyableCollection } from '../utils/collections/IdentifyableCollection.js';

/**
 * WorkersRegistry manages the creation and tracking of Worker instances.
 * @author darthjee
 */
class WorkersRegistry {
  #factory;
  #jobRegistry;
  #quantity;
  #workers;
  #busy;
  #idle;

  /**
   * Creates a new WorkersRegistry instance.
   * @param {object} params - The parameters for creating a WorkersRegistry instance.
   * @param {JobRegistry} params.jobRegistry - The job registry shared among all workers.
   * @param {WorkerFactory} [params.factory] - The factory for creating Worker instances (injected for testing).
   * @param {number} params.quantity - The number of workers to be built.
   * @param {IdentifyableCollection} [params.workers] - The collection of all workers (injected for testing).
   * @param {IdentifyableCollection} [params.busy] - The collection of busy workers (injected for testing).
   * @param {IdentifyableCollection} [params.idle] - The collection of idle workers (injected for testing).
   */
  constructor({
    jobRegistry,
    quantity,
    factory = new WorkerFactory({ jobRegistry, workerRegistry: this }),
    workers = new IdentifyableCollection(),
    busy = new IdentifyableCollection(),
    idle = new IdentifyableCollection()
  }) {
    this.#jobRegistry = jobRegistry;
    this.#factory = factory;
    this.#quantity = quantity;
    this.#workers = workers;
    this.#busy = busy;
    this.#idle = idle;
  }

  /**
   * Initializes the specified number of workers
   *
   * This method creates the workers and adds them to the internal workers list,
   * marking them as idle.
   * @returns {void}
   */
  initWorkers() {
    for (let i = 0; i < this.#quantity; i++) {
      this.#buildWorker();
    }
  }

  /**
   * Sets a worker as busy.
   * @param {string} worker_id - The ID of the worker to set as busy.
   */
  setBusy(worker_id) {
    const worker = this.#workers.get(worker_id);

    if (worker) {
      this.#idle.remove(worker_id);
      this.#busy.push(worker);
    }
  }

  /**
   * Sets a worker as idle.
   * @param {string} worker_id - The ID of the worker to set as idle.
   */
  setIdle(worker_id) {
    const worker = this.#workers.get(worker_id);

    if (worker) {
      this.#busy.remove(worker_id);
      this.#idle.push(worker);
    }
  }

  /**
   * Checks if there is at least one busy worker.
   * @returns {boolean} True if there is at least one busy worker, false otherwise.
   */
  hasBusyWorker() {
    return this.#busy.hasAny();
  }

  /**
   * Checks if there is at least one idle worker.
   * @returns {boolean} True if there is at least one idle worker, false otherwise.
   */
  hasIdleWorker() {
    return this.#idle.hasAny();
  }

  /**
   * Gets an idle worker if available.
   * @returns {Worker|null} An idle worker if available, or null if no idle workers are present.
   */
  getIdleWorker() {
    if (!this.hasIdleWorker()) {
      return null;
    }
    const workerId = this.#idle.byIndex(0).id;

    this.setBusy(workerId);

    return this.#workers.get(workerId);
  }

  /**
   * Returns counts of workers in each state.
   * @returns {{ idle: number, busy: number }} Counts of workers in each state.
   */
  stats() {
    return {
      idle: this.#idle.size(),
      busy: this.#busy.size(),
    };
  }

  /**
   * Builds a new Worker with a unique UUID and adds it to the internal workers list.
   * @returns {Worker} The newly created Worker instance.
   */
  #buildWorker() {
    const worker = this.#factory.build({ workerRegistry: this });

    this.#workers.push(worker);
    this.#idle.push(worker);

    return worker;
  }
}

export { WorkersRegistry };
