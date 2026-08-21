import { WorkerFactory } from 'deku-swarm';
import { DummyWorker } from '../models/DummyWorker.js';

class DummyWorkerFactory extends WorkerFactory {
  constructor(options) {
    super({ ...options, klass: DummyWorker });
  }
}

export { DummyWorkerFactory };