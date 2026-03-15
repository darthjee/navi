import { Worker } from '../../lib/models/Worker.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { Job } from '../../lib/models/Job.js';

describe('Worker', () => {
  let jobRegistry;
  let workerRegistry;
  let worker;

  beforeEach(() => {
    jobRegistry = new JobRegistry();
    workerRegistry = new WorkersRegistry({ quantity: 0, jobRegistry });
    worker = new Worker({ id: 1, jobRegistry, workerRegistry });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(worker.id).toEqual(1);
    });

    it('stores the job registry', () => {
      expect(worker.jobRegistry).toEqual(jobRegistry);
    });

    it('stores the worker registry', () => {
      expect(worker.workerRegistry).toEqual(workerRegistry);
    });
  });

  describe('#assign', () => {
    it('assigns a job to the worker', () => {
      const job = new Job({ payload: { value: 1 } });
      worker.assign(job);
      expect(worker.job).toEqual(job);
    });
  });
});
