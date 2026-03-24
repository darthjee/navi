import { JobFactory } from '../../../lib/factories/JobFactory';

class DummyJobFactory extends JobFactory {
  constructor(options) {
    super({ ...options, klass: DummyJob });
  }
}

export { DummyJobFactory };