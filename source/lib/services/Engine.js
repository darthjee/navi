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
    const job = this.jobRegistry.pick();

    if (job) {
      const worker = this.workersRegistry.getIdleWorker();

      if (worker) {
        worker.execute(job);
      } else {
        // No available workers, requeue the job
        this.jobRegistry.requeue(job);
      }
    }
  }
}

export { Engine };
