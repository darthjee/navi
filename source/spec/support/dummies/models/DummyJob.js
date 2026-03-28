import { Job } from '../../../../lib/models/Job.js';

class DummyJob extends Job {

  static setSuccessRate(rate) {
    this._successRate = rate;
  }

  static getSuccessRate() {
    return this._successRate ?? 1;
  }

  perform() {
    this.lastError = undefined;

    if (Math.random() > DummyJob.getSuccessRate()) {
      this._fail(new Error('Job failed'));
    }
  }
}

export { DummyJob };