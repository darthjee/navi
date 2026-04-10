import { WorkerFactory } from '../../../lib/factories/WorkerFactory.js';
import { Worker } from '../../../lib/models/Worker.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';

describe('WorkerFactory', () => {
  describe('#build', () => {
    let factory;

    beforeEach(() => {
      JobRegistry.build({ cooldown: -1 });
      WorkersRegistry.build({ quantity: 0 });
      factory = new WorkerFactory();
    });

    afterEach(() => {
      JobRegistry.reset();
      WorkersRegistry.reset();
    });

    it('builds an instance of Worker', () => {
      const worker = factory.build();
      expect(worker).toBeInstanceOf(Worker);
    });
  });
});