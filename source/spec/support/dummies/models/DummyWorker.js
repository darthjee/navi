import { Worker } from '../../../../lib/models/Worker.js';
import { JobRegistry } from '../../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../../lib/registry/WorkersRegistry.js';

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
      WorkersRegistry.setIdle(this.id);
    }
  }
}

export { DummyWorker };