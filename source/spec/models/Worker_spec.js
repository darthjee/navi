import { Job } from '../../lib/models/Job.js';
import { Worker } from '../../lib/models/Worker.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';

describe('Worker', () => {
  let jobRegistry;
  let workerRegistry;
  let worker;
  let clients;

  beforeEach(() => {
    clients = new ClientRegistry({});
    jobRegistry = new JobRegistry({ clients });
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
