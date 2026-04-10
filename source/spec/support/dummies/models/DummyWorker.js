import { Worker } from '../../../../lib/models/Worker.js';
import { JobRegistry } from '../../../../lib/registry/JobRegistry.js';

class DummyWorker extends Worker {
  perform() {
    if (!this.job) {
      throw new Error('No job assigned to worker');
    }

    try {
      this.job.perform();
      JobRegistry.finish(this.job);
    } catch (error) {
      JobRegistry.fail(this.job);
    } finally {
      this.job = undefined;
      this.workerRegistry.setIdle(this.id);
    }
  }
}

export { DummyWorker };