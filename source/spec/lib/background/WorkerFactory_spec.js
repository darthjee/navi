import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { Worker } from '../../../lib/background/Worker.js';
import { WorkerFactory } from '../../../lib/background/WorkerFactory.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';

describe('WorkerFactory', () => {
  describe('#build', () => {
    let factory;

    beforeEach(() => {
      JobRegistry.build({ cooldown: -1 });
      WorkersRegistry.build({ quantity: 0 });
      factory = new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
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