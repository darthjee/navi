import { Factory } from './Factory.js';
import { Job } from '../models/Job.js';
import { IdGenerator } from '../utils/IdGenerator.js';

class JobFactory extends Factory {
  constructor({ klass = Job, attributesGenerator = new IdGenerator() } = {}) {
    super({ klass, attributesGenerator });
  }
}

export { JobFactory };