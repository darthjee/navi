import { WorkersAllocator } from '../../../lib/services/WorkersAllocator.js';

class DummyWorkersAllocator extends WorkersAllocator {
  _allocateWorkerToJob(worker, job) {
    worker.assign(job);
  }
}

export { DummyWorkersAllocator };