import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';
import { Queue } from '../../lib/utils/Queue.js';

describe('JobRegistry', () => {
  let registry;
  let clients;

  beforeEach(() => {
    clients = new ClientRegistry();
  });

  describe('#stats', () => {
    let queue;
    let failedQueue;
    let finishedCollection;
    let deadCollection;
    let processingCollection;

    beforeEach(() => {
      queue = new Queue();
      failedQueue = new Queue();
      finishedCollection = new IdentifyableCollection();
      deadCollection = new IdentifyableCollection();
      processingCollection = new IdentifyableCollection();
      registry = new JobRegistry({
        queue,
        failed: failedQueue,
        finished: finishedCollection,
        dead: deadCollection,
        processing: processingCollection,
        clients,
      });
    });

    describe('when no jobs have been added', () => {
      it('returns zero counts for all states', () => {
        expect(registry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 0,
          finished: 0,
          dead: 0,
        });
      });
    });

    describe('when a job has been enqueued', () => {
      beforeEach(() => {
        registry.enqueue({ parameters: { value: 1 } });
      });

      it('returns enqueued count of 1', () => {
        expect(registry.stats()).toEqual({
          enqueued: 1,
          processing: 0,
          failed: 0,
          finished: 0,
          dead: 0,
        });
      });
    });

    describe('when a job is being processed', () => {
      beforeEach(() => {
        registry.enqueue({ parameters: { value: 1 } });
        registry.pick();
      });

      it('returns processing count of 1', () => {
        expect(registry.stats()).toEqual({
          enqueued: 0,
          processing: 1,
          failed: 0,
          finished: 0,
          dead: 0,
        });
      });
    });

    describe('when a job has finished', () => {
      beforeEach(() => {
        registry.enqueue({ parameters: { value: 1 } });
        const job = registry.pick();
        registry.finish(job);
      });

      it('returns finished count of 1', () => {
        expect(registry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 0,
          finished: 1,
          dead: 0,
        });
      });
    });

    describe('when a non-exhausted job has failed', () => {
      beforeEach(() => {
        registry.enqueue({ parameters: { value: 1 } });
        const job = registry.pick();
        registry.fail(job);
      });

      it('returns failed count of 1', () => {
        expect(registry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 1,
          finished: 0,
          dead: 0,
        });
      });
    });

    describe('when an exhausted job has failed', () => {
      beforeEach(() => {
        registry.enqueue({ parameters: { value: 1 } });
        const job = registry.pick();
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        registry.fail(job);
      });

      it('returns dead count of 1', () => {
        expect(registry.stats()).toEqual({
          enqueued: 0,
          processing: 0,
          failed: 0,
          finished: 0,
          dead: 1,
        });
      });
    });
  });
});
