import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { Engine } from '../../lib/services/Engine.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';
import { DummyJobFactory } from '../support/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../support/factories/DummyWorkerFactory.js';
import { DummyJob } from '../support/models/DummyJob.js';

describe('Engine', () => {
  let engine;
  let jobFactory;
  let jobRegistry;
  let workerFactory;
  let workersRegistry;

  let finished;

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    finished = new IdentifyableCollection();
    jobRegistry = new JobRegistry({ finished, factory: jobFactory });

    workerFactory = new DummyWorkerFactory({ jobRegistry });
    workersRegistry = new WorkersRegistry({ quantity: 2, factory: workerFactory });
    workersRegistry.initWorkers();

    DummyJob.setSuccessRate(1);
    engine = new Engine({ jobRegistry, workersRegistry });

    spyOn(console, 'error').and.stub();
  });

  describe('start', () => {
    describe('when there are no jobs to process', () => {
      it('does nothing', () => {
        expect(jobRegistry.hasJob()).toBeFalse();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(0);
      });
    });

    describe('when there are jobs to process', () => {
      beforeEach(() => {
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
      });

      it('processes all jobs', () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(2);
      });
    });

    describe('when there more jobs than workers', () => {
      beforeEach(() => {
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
      });

      it('processes all jobs', () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(4);
      });
    });

    describe('when jobs fail all the time', () => {
      beforeEach(() => {
        DummyJob.setSuccessRate(0);
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
      });

      it('processes all jobs', () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(0);
      });
    });
  });
});