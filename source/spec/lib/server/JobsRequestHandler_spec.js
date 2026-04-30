import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { JobsRequestHandler } from '../../../lib/server/JobsRequestHandler.js';

describe('JobsRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    res = { json: jasmine.createSpy('json') };
    handler = new JobsRequestHandler();
  });

  afterEach(() => {
    JobRegistry.reset();
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
      handler.handle({ params: { status: 'enqueued' }, query: {} }, res);

      expect(JobRegistry.jobsByStatus).toHaveBeenCalledWith('enqueued');
    });

    it('responds with the serialized job list as JSON including jobClass', () => {
      handler.handle({ params: { status: 'enqueued' }, query: {} }, res);

      expect(res.json).toHaveBeenCalledWith([
        {
          id: 'abc',
          status: 'enqueued',
          attempts: 0,
          jobClass: 'ResourceRequestJob',
          url: '/items.json',
        },
        {
          id: 'def',
          status: 'enqueued',
          attempts: 1,
          jobClass: 'ActionProcessingJob',
        },
      ]);
    });

    describe('when a single class filter is provided', () => {
      it('returns only jobs matching that class', () => {
        handler.handle(
          { params: { status: 'enqueued' }, query: { filters: { class: ['ResourceRequestJob'] } } },
          res,
        );

        expect(res.json).toHaveBeenCalledWith([{
          id: 'abc',
          status: 'enqueued',
          attempts: 0,
          jobClass: 'ResourceRequestJob',
          url: '/items.json',
        }]);
      });
    });

    describe('when multiple class filters are provided', () => {
      it('returns jobs matching any of the classes', () => {
        handler.handle(
          {
            params: { status: 'enqueued' },
            query: { filters: { class: ['ResourceRequestJob', 'ActionProcessingJob'] } },
          },
          res,
        );

        expect(res.json).toHaveBeenCalledWith([
          {
            id: 'abc',
            status: 'enqueued',
            attempts: 0,
            jobClass: 'ResourceRequestJob',
            url: '/items.json',
          },
          {
            id: 'def',
            status: 'enqueued',
            attempts: 1,
            jobClass: 'ActionProcessingJob',
          },
        ]);
      });
    });

    describe('when an unknown class filter is provided', () => {
      it('returns an empty list', () => {
        handler.handle(
          { params: { status: 'enqueued' }, query: { filters: { class: ['UnknownJob'] } } },
          res,
        );

        expect(res.json).toHaveBeenCalledWith([]);
      });
    });

    describe('when the status is unknown', () => {
      beforeEach(() => {
        JobRegistry.jobsByStatus.and.returnValue([]);
      });

      it('responds with an empty array', () => {
        handler.handle({ params: { status: 'unknown' }, query: {} }, res);

        expect(res.json).toHaveBeenCalledWith([]);
      });
    });
  });
});

