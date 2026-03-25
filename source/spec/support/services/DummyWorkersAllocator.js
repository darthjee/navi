import { WorkersAllocator } from '../../../lib/services/WorkersAllocator.js';
import { Queue } from '../../../lib/utils/Queue.js';

class DummyWorkersAllocator extends WorkersAllocator {
  #workers = new Queue();

  allocate() {
    this.#runWorkers();
    while (this._canAllocate()) {
      this._allocateNext();
    }
  }

  _allocateWorkerToJob(worker, job) {
    worker.assign(job);
    this.#workers.push(worker);
  }

  #runWorkers() {
    while (this.#workers.hasItem()) {
      const worker = this.#workers.pick();
      worker.perform();
    }
  }
}

export { DummyWorkersAllocator };