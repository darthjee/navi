class WorkersAllocator {
  constructor({ jobRegistry, workersRegistry }) {
    this.jobRegistry = jobRegistry;
    this.workersRegistry = workersRegistry;
  }

  allocate() {
    while (this.#canAllocate()) {
      this.#allocateWorker();
    }
  }

  #allocateWorker() {
    const job = this.jobRegistry.pick();
    const worker = this.workersRegistry.getIdleWorker();
    worker.assing(job);
  }

  #canAllocate() {
    return this.jobRegistry.hasJob() && this.workersRegistry.hasIdleWorker();
  }
}

export { WorkersAllocator };