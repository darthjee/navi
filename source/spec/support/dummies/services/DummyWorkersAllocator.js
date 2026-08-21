import { WorkersAllocator } from 'deku-swarm';

class DummyWorkersAllocator extends WorkersAllocator {
  _allocateWorkerToJob(worker, job) {
    worker.assign(job);
  }
}

export { DummyWorkersAllocator };