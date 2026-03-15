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
    this.jobRegistry.pick();
    this.workersRegistry.getIdleWorker();
  }

  #canAllocate() {
    return this.jobRegistry.hasJob() && this.workersRegistry.hasIdleWorker();
  }
}

export { WorkersAllocator };