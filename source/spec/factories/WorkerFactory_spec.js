import { WorkerFactory } from '../../lib/factories/WorkerFactory.js';
import { Worker } from '../../lib/models/Worker.js';
import { JobRegistryFactory } from '../support/factories/JobRegistryFactory.js';
import { WorkersRegistryFactory } from '../support/factories/WorkersRegistryFactory.js';

describe('WorkerFactory', () => {
  describe('#build', () => {
    let factory;
    let jobRegistry;
    let workerRegistry;

    beforeEach(() => {
      jobRegistry = JobRegistryFactory.build();
      workerRegistry = WorkersRegistryFactory.build({ jobRegistry });
      factory = new WorkerFactory({ jobRegistry, workerRegistry });
    });

    it('builds an instance of Worker', () => {
      const worker = factory.build();
      expect(worker).toBeInstanceOf(Worker);
    });
  });
});