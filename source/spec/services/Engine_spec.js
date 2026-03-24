import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { Engine } from '../../lib/services/Engine.js';
import { DummyJobFactory } from '../support/factories/DummyJobFactory.js';

describe('Engine', () => {
  let engine;
  let jobFactory;
  let jobRegistry;
  let workersRegistry;

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    jobRegistry = new JobRegistry({ factory: jobFactory });

    workersRegistry = new WorkersRegistry({ quantity: 1 });
    workersRegistry.initWorkers();

    engine = new Engine({ jobRegistry, workersRegistry });
  });

  describe('start', () => {
    describe('when there are jobs to process and idle workers', () => {
      it('does nothing', () => {
        expect(jobRegistry.hasJob()).toBeFalse();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
      });
    });
  });
});