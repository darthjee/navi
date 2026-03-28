import { Worker } from '../../../../lib/models/Worker.js';

class DummyWorker extends Worker {
  perform() {
    if (!this.job) {
      throw new Error('No job assigned to worker');
    }

    try {
      this.job.perform();
      this.jobRegistry.finish(this.job);
    } catch (error) {
      this.jobRegistry.fail(this.job);
    } finally {
      this.job = undefined;
      this.workerRegistry.setIdle(this.id);
    }
  }
}

export { DummyWorker };