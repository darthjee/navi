import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';

describe('JobRegistry', () => {
  let clients;

  beforeEach(() => {
    clients = new ClientRegistry();
    JobFactory.build('ResourceRequestJob', { attributes: { clients } });
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
  });

  describe('.stats', () => {
    let queue;
    let retryQueue;
    let finishedCollection;
    let deadCollection;
    let processingCollection;

    beforeEach(() => {
      queue = new Queue();
      retryQueue = new Queue();
      finishedCollection = new IdentifyableCollection();
      deadCollection = new IdentifyableCollection();
      processingCollection = new IdentifyableCollection();
      JobRegistry.build({
        queue,
        retryQueue,
        finished: finishedCollection,
        dead: deadCollection,
        processing: processingCollection,
        cooldown: -1,
      });
    });

    describe('when no jobs have been added', () => {
      it('returns zero counts for all states', () => {
        expect(JobRegistry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 0,
          retryQueue: 0,
          finished: 0,
          dead: 0,
          total: 0,
        });
      });
    });

    describe('when a job has been enqueued', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      });

      it('returns enqueued count of 1', () => {
        expect(JobRegistry.stats()).toEqual({
          enqueued: 1,
          processing: 0,
          failed: 0,
          retryQueue: 0,
          finished: 0,
          dead: 0,
          total: 0,
        });
      });
    });

    describe('when a job is being processed', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
      });

      it('returns processing count of 1', () => {
        expect(JobRegistry.stats()).toEqual({
          enqueued: 0,
          processing: 1,
          failed: 0,
          retryQueue: 0,
          finished: 0,
          dead: 0,
          total: 0,
        });
      });
    });

    describe('when a job has finished', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        const job = JobRegistry.pick();
        JobRegistry.finish(job);
      });

      it('returns finished count of 1', () => {
        expect(JobRegistry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 0,
          retryQueue: 0,
          finished: 1,
          dead: 0,
          total: 1,
        });
      });
    });

    describe('when a non-exhausted job has failed', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        const job = JobRegistry.pick();
        JobRegistry.fail(job);
      });

      it('returns failed count of 1', () => {
        expect(JobRegistry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 1,
          retryQueue: 0,
          finished: 0,
          dead: 0,
          total: 0,
        });
      });
    });

    describe('when an exhausted job has failed', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        const job = JobRegistry.pick();
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        JobRegistry.fail(job);
      });

      it('returns dead count of 1', () => {
        expect(JobRegistry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 0,
          retryQueue: 0,
          finished: 0,
          dead: 1,
          total: 1,
        });
      });
    });

    describe('when a job has been promoted to retryQueue', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        const job = JobRegistry.pick();
        JobRegistry.fail(job);
        JobRegistry.promoteReadyJobs();
      });

      it('returns retryQueue count of 1 and failed count of 0', () => {
        expect(JobRegistry.stats()).toEqual({
          enqueued:   0,
          processing: 0,
          failed:     0,
          retryQueue: 1,
          finished:   0,
          dead:       0,
          total:      0,
        });
      });
    });
  });
});
