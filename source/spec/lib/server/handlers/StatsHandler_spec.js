import { JobRegistry, WorkersRegistry, IdentifyableCollection } from 'deku-swarm';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { StatsHandler } from '../../../../lib/server/handlers/StatsHandler.js';

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
    EmissionRegistry.build();
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    JobRegistry.reset();
    WorkersRegistry.reset();
    EmissionRegistry.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new StatsHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    it('responds with combined stats', () => {
      new StatsHandler({}, res).handle();

      expect(res.json).toHaveBeenCalledWith({
        jobs:      jobStats,
        workers:   workerStats,
        emissions: { extracted: 0, emitted: 0, failed: 0, dead: 0 },
      });
    });

    it('reflects recorded emission counts', () => {
      EmissionRegistry.incExtracted(4);
      EmissionRegistry.recordEmission({ status: 'success', url: '/hook', method: 'POST' });

      new StatsHandler({}, res).handle();

      expect(res.json.calls.mostRecent().args[0].emissions).toEqual({
        extracted: 4, emitted: 1, failed: 0, dead: 0,
      });
    });
  });
});
