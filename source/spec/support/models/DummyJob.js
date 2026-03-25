import { Job } from '../../../lib/models/Job.js';

class DummyJob extends Job {

  static setSuccessRate(rate) {
    this._successRate = rate;
  }

  static getSuccessRate() {
    return this._successRate ?? 1;
  }

  async perform() {
    if (Math.random() > DummyJob.getSuccessRate()) {
      throw new Error('Job failed');
    }
  }
}

export { DummyJob };