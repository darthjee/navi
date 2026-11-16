import { Job } from '../../lib/background/Job.js';
import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { IdentifyableCollection } from '../../lib/collections/IdentifyableCollection.js';

const ids = status => JobRegistry.jobsByStatus(status).map(job => job.id);

describe('JobRegistry pruning', () => {
  afterEach(() => {
    JobRegistry.reset();
  });

  const finishJob = id => {
    const job = new Job({ id });
    JobRegistry.finish(job);
    return job;
  };

  const killJob = id => {
    const job = new Job({ id, maxRetries: 0 });
    JobRegistry.fail(job);
    return job;
  };

  describe('retention', () => {
    beforeEach(() => {
      JobRegistry.build({ retention: { finished: 2 } });
    });

    it('evicts the oldest finished jobs over the cap', () => {
      ['a', 'b', 'c'].forEach(finishJob);

      expect(ids('finished')).toEqual(['b', 'c']);
      expect(JobRegistry.stats().pruned).toEqual({ finished: 1, dead: 0 });
    });

    it('leaves omitted statuses unbounded', () => {
      ['a', 'b', 'c', 'd'].forEach(killJob);

      expect(ids('dead')).toEqual(['a', 'b', 'c', 'd']);
    });

    it('caps dead jobs when configured', () => {
      JobRegistry.reset();
      JobRegistry.build({ retention: { dead: 1 } });
      ['a', 'b'].forEach(killJob);

      expect(ids('dead')).toEqual(['b']);
    });

    it('evicts on arrival when the cap is 0', () => {
      JobRegistry.reset();
      JobRegistry.build({ retention: { finished: 0 } });
      finishJob('a');

      expect(ids('finished')).toEqual([]);
    });

    it('trims oversized initial collections on the next push', () => {
      JobRegistry.reset();
      const initial = new IdentifyableCollection();
      ['x', 'y', 'z'].forEach(id => initial.push(new Job({ id })));
      JobRegistry.build({ finished: initial, retention: { finished: 2 } });
      finishJob('w');

      expect(ids('finished')).toEqual(['z', 'w']);
    });
  });

  describe('.prune', () => {
    beforeEach(() => {
      JobRegistry.build();
    });

    it('removes everything of the selected statuses on a bare call', () => {
      finishJob('a');
      killJob('b');

      expect(JobRegistry.prune()).toEqual({ finished: 1, dead: 1 });
      expect(ids('finished')).toEqual([]);
      expect(ids('dead')).toEqual([]);
    });

    it('filters by statuses', () => {
      finishJob('a');
      killJob('b');

      expect(JobRegistry.prune({ statuses: ['dead'] })).toEqual({ finished: 0, dead: 1 });
      expect(ids('finished')).toEqual(['a']);
    });

    it('keeps the most recent jobs with keep', () => {
      ['a', 'b', 'c'].forEach(finishJob);

      expect(JobRegistry.prune({ keep: 1 })).toEqual({ finished: 2, dead: 0 });
      expect(ids('finished')).toEqual(['c']);
    });

    it('removes jobs older than the cutoff', () => {
      const now = 10000;
      spyOn(Date, 'now').and.returnValue(now);
      finishJob('old').markEnded(now - 500);
      finishJob('new').markEnded(now - 10);

      expect(JobRegistry.prune({ olderThan: 100 }).finished).toEqual(1);
      expect(ids('finished')).toEqual(['new']);
    });

    it('uses the union of keep and olderThan', () => {
      const now = 10000;
      spyOn(Date, 'now').and.returnValue(now);
      finishJob('a').markEnded(now - 500);
      finishJob('b').markEnded(now - 10);
      finishJob('c').markEnded(now - 10);

      expect(JobRegistry.prune({ keep: 2, olderThan: 100 }).finished).toEqual(1);
      expect(ids('finished')).toEqual(['b', 'c']);

      expect(JobRegistry.prune({ keep: 1, olderThan: 100 }).finished).toEqual(1);
      expect(ids('finished')).toEqual(['c']);
    });

    it('skips jobs without endedAt for olderThan', () => {
      const job = finishJob('a');
      job.clearEnded();

      expect(JobRegistry.prune({ olderThan: 0 }).finished).toEqual(0);
    });

    it('never touches non-terminal statuses', () => {
      const job = new Job({ id: 'p' });
      JobRegistry.requeue(job);
      finishJob('a');
      JobRegistry.prune();

      expect(ids('enqueued')).toEqual(['p']);
    });

    it('makes pruned jobs unknown to jobById and retryJob', () => {
      finishJob('a');
      killJob('b');
      JobRegistry.prune();

      expect(JobRegistry.jobById('a')).toBeNull();
      expect(JobRegistry.retryJob('b')).toBeNull();
    });

    it('accumulates stats().pruned and resets on clearQueues', () => {
      ['a', 'b'].forEach(finishJob);
      killJob('c');
      JobRegistry.prune({ statuses: ['finished'] });

      expect(JobRegistry.stats().pruned).toEqual({ finished: 2, dead: 0 });

      JobRegistry.clearQueues();
      expect(JobRegistry.stats().pruned).toEqual({ finished: 0, dead: 0 });
    });

    describe('validation', () => {
      it('rejects invalid statuses', () => {
        expect(() => JobRegistry.prune({ statuses: ['enqueued'] })).toThrowError(/statuses/);
        expect(() => JobRegistry.prune({ statuses: 'dead' })).toThrowError(/statuses/);
      });

      it('rejects invalid keep', () => {
        expect(() => JobRegistry.prune({ keep: -1 })).toThrowError(/keep/);
        expect(() => JobRegistry.prune({ keep: 1.5 })).toThrowError(/keep/);
      });

      it('rejects invalid olderThan', () => {
        expect(() => JobRegistry.prune({ olderThan: -1 })).toThrowError(/olderThan/);
        expect(() => JobRegistry.prune({ olderThan: '1' })).toThrowError(/olderThan/);
      });
    });
  });

  describe('endedAt', () => {
    beforeEach(() => {
      JobRegistry.build();
    });

    it('is set on finish and dead', () => {
      expect(finishJob('a').endedAt).not.toBeNull();
      expect(killJob('b').endedAt).not.toBeNull();
    });

    it('is reset by retryJob', () => {
      const job = killJob('b');
      JobRegistry.retryJob('b');

      expect(job.endedAt).toBeNull();
    });
  });

  describe('build retention validation', () => {
    it('rejects unknown keys', () => {
      expect(() => JobRegistry.build({ retention: { failed: 1 } })).toThrowError(/retention key/);
    });

    it('rejects invalid values', () => {
      expect(() => JobRegistry.build({ retention: { finished: -1 } })).toThrowError(/retention.finished/);
      expect(() => JobRegistry.build({ retention: { dead: 1.5 } })).toThrowError(/retention.dead/);
    });
  });
});
