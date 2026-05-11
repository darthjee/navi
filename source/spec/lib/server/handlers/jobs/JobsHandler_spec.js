import { JobRegistry } from '../../../../../lib/background/JobRegistry.js';
import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { JobsHandler } from '../../../../../lib/server/handlers/jobs/JobsHandler.js';

describe("describe('JobsHandler'", () => {
  let res;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new JobsHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    const resourceJob = {
      id: 'abc',
      _attempts: 0,
      constructor: { name: 'ResourceRequestJob' },
      arguments: { url: '/items.json' },
    };

    const actionJob = {
      id: 'def',
      _attempts: 1,
      constructor: { name: 'ActionProcessingJob' },
      arguments: { url: '/actions.json' },
    };

    beforeEach(() => {
      spyOn(JobRegistry, 'jobsByStatus').and.returnValue([resourceJob, actionJob]);
    });

    it('calls jobsByStatus with the status param', () => {
      new JobsHandler({ params: { status: 'enqueued' }, query: {} }, res).handle();
      expect(JobRegistry.jobsByStatus).toHaveBeenCalledWith('enqueued');
    });

    it('responds with the serialized job list', () => {
      new JobsHandler({ params: { status: 'enqueued' }, query: {} }, res).handle();
      expect(res.json).toHaveBeenCalledWith([
        { id: 'abc', status: 'enqueued', attempts: 0, jobClass: 'ResourceRequestJob', url: '/items.json' },
        { id: 'def', status: 'enqueued', attempts: 1, jobClass: 'ActionProcessingJob' },
      ]);
    });

    describe('when a class filter is provided', () => {
      it('returns only matching jobs', () => {
        new JobsHandler(
          { params: { status: 'enqueued' }, query: { filters: { class: ['ResourceRequestJob'] } } },
          res
        ).handle();
        expect(res.json).toHaveBeenCalledWith([
          { id: 'abc', status: 'enqueued', attempts: 0, jobClass: 'ResourceRequestJob', url: '/items.json' },
        ]);
      });
    });

    describe('when the status is unknown', () => {
      beforeEach(() => {
        JobRegistry.jobsByStatus.and.returnValue([]);
      });

      it('responds with an empty array', () => {
        new JobsHandler({ params: { status: 'unknown' }, query: {} }, res).handle();
        expect(res.json).toHaveBeenCalledWith([]);
      });
    });
  });
});
