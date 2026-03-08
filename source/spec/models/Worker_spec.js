import { JobRegistry } from '../../lib/models/JobRegistry.js';
import { Worker } from '../../lib/models/Worker.js';

describe('Worker', () => {
  let jobRegistry;
  let worker;

  beforeEach(() => {
    jobRegistry = new JobRegistry();
    worker = new Worker({ id: 1, jobRegistry });
  });

  describe('#constructor', () => {
    it('stores the job registry', () => {
      expect(worker.jobRegistry).toEqual(jobRegistry);
    });

    it('stores the id', () => {
      expect(worker.id).toEqual(1);
    });
  });
});
