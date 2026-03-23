import { WorkerFactory } from '../../lib/factories/WorkerFactory.js';
import { Worker } from '../../lib/models/Worker.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';

describe('Factory', () => {
  describe('#build', () => {
    let factory;
    let jobRegistry;
    let workerRegistry;

    beforeEach(() => {
      factory = new WorkerFactory();
      jobRegistry = new JobRegistry();
      workerRegistry = new WorkersRegistry({ jobRegistry, workerRegistry });
    });

    it('builds an instance of Worker', () => {
      const worker = factory.build({ jobRegistry, workerRegistry });
      expect(worker).toBeInstanceOf(Worker);
    });
  });
});