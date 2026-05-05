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

    it('calls jobsByStatus with the status param and no class filter', () => {
      handler.handle({ params: { status: 'enqueued' }, query: {} }, res);

      expect(JobRegistry.jobsByStatus).toHaveBeenCalledWith('enqueued', { jobClasses: [] });
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
      it('passes the class filter to jobsByStatus', () => {
        handler.handle(
          { params: { status: 'enqueued' }, query: { filters: { class: ['ResourceRequestJob'] } } },
          res,
        );

        expect(JobRegistry.jobsByStatus).toHaveBeenCalledWith('enqueued', { jobClasses: ['ResourceRequestJob'] });
      });
    });

    describe('when multiple class filters are provided', () => {
      it('passes all class filters to jobsByStatus', () => {
        handler.handle(
          {
            params: { status: 'enqueued' },
            query: { filters: { class: ['ResourceRequestJob', 'ActionProcessingJob'] } },
          },
          res,
        );

        expect(JobRegistry.jobsByStatus).toHaveBeenCalledWith(
          'enqueued',
          { jobClasses: ['ResourceRequestJob', 'ActionProcessingJob'] },
        );
      });
    });

    describe('when a single class filter is provided as a string (qs edge case)', () => {
      it('normalises the value to a one-element array', () => {
        handler.handle(
          { params: { status: 'enqueued' }, query: { filters: { class: 'ResourceRequestJob' } } },
          res,
        );

        expect(JobRegistry.jobsByStatus).toHaveBeenCalledWith('enqueued', { jobClasses: ['ResourceRequestJob'] });
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

