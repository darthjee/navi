import { WorkerFactory } from '../../../lib/factories/WorkerFactory.js';
import { Worker } from '../../../lib/models/Worker.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistryFactory } from '../../support/factories/WorkersRegistryFactory.js';

describe('WorkerFactory', () => {
  describe('#build', () => {
    let factory;
    let workerRegistry;

    beforeEach(() => {
      JobRegistry.build({ cooldown: -1 });
      workerRegistry = WorkersRegistryFactory.build();
      factory = new WorkerFactory({ workerRegistry });
    });

    afterEach(() => {
      JobRegistry.reset();
    });

    it('builds an instance of Worker', () => {
      const worker = factory.build();
      expect(worker).toBeInstanceOf(Worker);
    });
  });
});