import { WorkerFactory } from '../../lib/factories/WorkerFactory.js';
import { Worker } from '../../lib/models/Worker.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { ClientRegistryFactory } from '../support/factories/ClientRegistryFactory.js';

describe('WorkerFactory', () => {
  describe('#build', () => {
    let factory;
    let jobRegistry;
    let workerRegistry;

    beforeEach(() => {
      const clients = ClientRegistryFactory.build({});
      jobRegistry = new JobRegistry({ clients });
      workerRegistry = new WorkersRegistry({ jobRegistry });
      factory = new WorkerFactory({ jobRegistry, workerRegistry });
    });

    it('builds an instance of Worker', () => {
      const worker = factory.build();
      expect(worker).toBeInstanceOf(Worker);
    });
  });
});