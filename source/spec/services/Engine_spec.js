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
  let dead;

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    finished = new IdentifyableCollection();
    dead = new IdentifyableCollection();
    jobRegistry = new JobRegistry({ finished, dead, factory: jobFactory });

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
        expect(dead.size()).toBe(0);
      });
    });

    describe('when jobs fail all the time', () => {
      beforeEach(() => {
        DummyJob.setSuccessRate(0);
        jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
      });

      it('processes all jobs until they are in the dead queue', () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(0);
        expect(dead.size()).toBe(1);
      });
    });

    describe('when jobs fails some times', () => {
      beforeEach(() => {
        DummyJob.setSuccessRate(0.1);

        for (let i = 0; i < 20; i++) {
          jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
        }
      });

      it('processes all jobs until they are in the finished or dead', () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size() + dead.size()).toBe(20);
        expect(finished.size()).not.toBe(0);
        expect(dead.size()).not.toBe(0);
      });
    });
  });
});