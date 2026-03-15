import { JobRegistry } from '../registry/JobRegistry.js';

class Engine {
  constructor({ workersRegistry }) {
    this.jobRegistry = new JobRegistry();
    this.workersRegistry = workersRegistry;
  }

  start() {
    // Start the engine by processing jobs
    this.#processJobs();
  }

  #processJobs() {
    // Main job processing loop

    while (this.#continueProcessing()) {
      const worker = this.workersRegistry.getIdleWorker();

      if (worker) {
        const job = this.jobRegistry.pick();
        worker.execute(job);
      }
    }
  }

  #continueProcessing() {
    return this.jobRegistry.hasJob()
    || this.workersRegistry.hasBusyWorker();
  }
}

export { Engine };
