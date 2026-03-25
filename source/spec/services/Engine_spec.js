import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { Engine } from '../../lib/services/Engine.js';
import { DummyJobFactory } from '../support/factories/DummyJobFactory.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';

describe('Engine', () => {
  let engine;
  let jobFactory;
  let jobRegistry;
  let workersRegistry;

  let finished;

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    finished = new IdentifyableCollection();
    jobRegistry = new JobRegistry({ finished, factory: jobFactory });

    workersRegistry = new WorkersRegistry({ quantity: 2 });
    workersRegistry.initWorkers();

    engine = new Engine({ jobRegistry, workersRegistry });
  });

  describe('start', () => {
    describe('when there are no jobs to process', () => {
      it('does nothing', () => {
        expect(jobRegistry.hasJob()).toBeFalse();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
      });
    });

    describe('when there are jobs to process and no idle workers', () => {
      beforeEach(() => {
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
      });

      it('does nothing', () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
      });
    });
  });
});