import { Worker } from '../../../../lib/models/Worker.js';

class DummyWorker extends Worker {
  #jobRegistry;
  #workersRegistry;

  constructor({ id, jobRegistry, workersRegistry }) {
    super({ id, jobRegistry, workersRegistry });
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;
  }

  perform() {
    if (!this.job) {
      throw new Error('No job assigned to worker');
    }

    try {
      this.job.perform();
      this.#jobRegistry.finish(this.job);
    } catch (error) {
      this.#jobRegistry.fail(this.job);
    } finally {
      this.job = undefined;
      this.#workersRegistry.setIdle(this.id);
    }
  }
}

export { DummyWorker };