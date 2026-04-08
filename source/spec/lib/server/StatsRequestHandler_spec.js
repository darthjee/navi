import { StatsRequestHandler } from '../../../lib/server/StatsRequestHandler.js';

describe('StatsRequestHandler', () => {
  let handler;
  let jobRegistry;
  let workersRegistry;
  let res;
  const jobStats = { enqueued: 1, processing: 0, failed: 0, finished: 5, dead: 0 };
  const workerStats = { idle: 3, busy: 1 };

  beforeEach(() => {
    jobRegistry = { stats: () => jobStats };
    workersRegistry = { stats: () => workerStats };
    res = { json: jasmine.createSpy('json') };
    handler = new StatsRequestHandler({ jobRegistry, workersRegistry });
  });

  describe('#handle', () => {
    it('responds with combined stats', () => {
      handler.handle({}, res);

      expect(res.json).toHaveBeenCalledWith({
        jobs:    jobStats,
        workers: workerStats,
      });
    });
  });
});
