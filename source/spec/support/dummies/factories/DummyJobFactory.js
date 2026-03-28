import { JobFactory } from '../../../../lib/factories/JobFactory.js';
import { DummyJob } from '../models/DummyJob.js';

class DummyJobFactory extends JobFactory {
  constructor(options) {
    super({ ...options, klass: DummyJob });
  }
}

export { DummyJobFactory };