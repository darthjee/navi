import { Factory } from './Factory.js';
import { Worker } from '../models/Worker.js';
import { IdGenerator } from '../utils/IdGenerator.js';

class WorkerFactory extends Factory {
  #jobRegistry;
  #workerRegistry;

  constructor({ klass = Worker, attributesGenerator = new IdGenerator(), jobRegistry, workerRegistry } = {}) {
    super({ klass, attributesGenerator });
    this.#jobRegistry = jobRegistry;
    this.#workerRegistry = workerRegistry;
  }

  build() {
    return super.build({ jobRegistry: this.#jobRegistry, workerRegistry: this.#workerRegistry });
  }
}

export { WorkerFactory };