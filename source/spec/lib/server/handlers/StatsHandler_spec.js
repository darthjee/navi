import { JobRegistry } from '../../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../../lib/background/WorkersRegistry.js';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { StatsHandler } from '../../../../lib/server/handlers/StatsHandler.js';
import { IdentifyableCollection } from '../../../../lib/utils/collections/IdentifyableCollection.js';

describe("describe('StatsHandler'", () => {
  let res;
  const jobStats = { enqueued: 1, processing: 0, failed: 0, finished: 5, dead: 0 };
  const workerStats = { idle: 3, busy: 1 };

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    spyOn(JobRegistry, 'stats').and.returnValue(jobStats);
    const idle = new IdentifyableCollection();
    const busy = new IdentifyableCollection();
    WorkersRegistry.build({ quantity: 0, idle, busy });
    spyOn(WorkersRegistry, 'stats').and.returnValue(workerStats);
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    JobRegistry.reset();
    WorkersRegistry.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new StatsHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    it('responds with combined stats', () => {
      new StatsHandler({}, res).handle();

      expect(res.json).toHaveBeenCalledWith({
        jobs:    jobStats,
        workers: workerStats,
      });
    });
  });
});
