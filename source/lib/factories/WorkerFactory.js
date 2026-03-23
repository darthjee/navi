import { Factory } from './Factory.js';
import { Worker } from '../models/Worker.js';
import { IdGenerator } from '../utils/IdGenerator.js';

class WorkerFactory extends Factory {
  constructor({ klass = Worker, attributesGenerator = new IdGenerator() } = {}) {
    super({ klass, attributesGenerator });
  }

  build({ jobRegistry, workerRegistry }) {
    return super.build({ jobRegistry, workerRegistry });
  }
}

export { WorkerFactory };