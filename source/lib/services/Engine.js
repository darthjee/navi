import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersAllocator } from './WorkersAllocator.js';

class Engine {
  constructor({ workersRegistry }) {
    this.jobRegistry = new JobRegistry();
    this.workersRegistry = workersRegistry;

    this.allocator = new WorkersAllocator({
      jobRegistry: this.jobRegistry,
      workersRegistry: this.workersRegistry,
    });
  }

  start() {
    // Start the engine by processing jobs
    this.#processJobs();
  }

  #processJobs() {
    // Main job processing loop

    while (this.#continueProcessing()) {
      this.allocator.allocate();
    }
  }

  #continueProcessing() {
    return this.jobRegistry.hasJob()
    || this.workersRegistry.hasIdleWorker();
  }
}

export { Engine };
