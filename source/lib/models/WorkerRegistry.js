import { randomUUID } from 'crypto';
import { Worker } from './Worker.js';

/**
 * WorkerRegistry manages the creation and tracking of Worker instances.
 * @author darthjee
 */
class WorkerRegistry {
  /**
   * Creates a new WorkerRegistry instance.
   * @param {object} params - The parameters for creating a WorkerRegistry instance.
   * @param {JobRegistry} params.jobRegistry - The job registry shared among all workers.
   * @param {number} params.workers - The number of workers to be built.
   */
  constructor({ jobRegistry, workers }) {
    this.jobRegistry = jobRegistry;
    this.workersCount = workers;
    this.workers = {};
    this.busy = {};
    this.idle = {};
  }

  /**
   * Builds a new Worker with a unique UUID and adds it to the internal workers list.
   * @returns {Worker} The newly created Worker instance.
   */
  buildWorker() {
    const id = this.#generateUUID();
    const worker = new Worker({ id, jobRegistry: this.jobRegistry });

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
