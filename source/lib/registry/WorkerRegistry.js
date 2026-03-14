import { randomUUID } from 'crypto';
import { Worker } from '../models/Worker.js';

/**
 * WorkerRegistry manages the creation and tracking of Worker instances.
 * @author darthjee
 */
class WorkerRegistry {
  /**
   * Creates a new WorkerRegistry instance.
   * @param {object} params - The parameters for creating a WorkerRegistry instance.
   * @param {JobRegistry} params.jobRegistry - The job registry shared among all workers.
   * @param {number} params.quantity - The number of workers to be built.
   */
  constructor({ jobRegistry, quantity }) {
    this.jobRegistry = jobRegistry;
    this.quantity = quantity;
    this.workers = {};
    this.busy = {};
    this.idle = {};
  }

  /**
   * Initializes the specified number of workers
   *
   * This method creates the workers and adds them to the internal workers list,
   * marking them as idle.
   * @returns {void}
   */
  initWorkers() {
    for (let i = 0; i < this.quantity; i++) {
      this.#buildWorker();
    }
  }

  /**
   * Sets a worker as busy.
   * @param {string} worker_id - The ID of the worker to set as busy.
   */
  setBusy(worker_id) {
    const worker = this.workers[worker_id];

    if (worker) {
      delete this.idle[worker_id];
      this.busy[worker_id] = worker;
    }
  }

  /**
   * Sets a worker as idle.
   * @param {string} worker_id - The ID of the worker to set as idle.
   */
  setIdle(worker_id) {
    const worker = this.workers[worker_id];

    if (worker) {
      delete this.busy[worker_id];
      this.idle[worker_id] = worker;
    }
  }

  /**
   * Builds a new Worker with a unique UUID and adds it to the internal workers list.
   * @returns {Worker} The newly created Worker instance.
   */
  #buildWorker() {
    const id = this.#generateUUID();
    const worker = new Worker({ id, jobRegistry: this.jobRegistry, workerRegistry: this });

    this.workers[id] = worker;
    this.idle[id] = worker;

    return worker;
  }

  /**
   * Generates a unique UUID that is not already assigned to any existing worker.
   * @returns {string} A unique UUID string.
   */
  #generateUUID() {
    let id;

    do {
      id = randomUUID();
    } while (this.workers[id]);

    return id;
  }
}

export { WorkerRegistry };
