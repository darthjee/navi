import { Job } from '../../../lib/models/Job.js';

class DummyJob extends Job {
  async perform() {
  }
}

export { DummyJob };