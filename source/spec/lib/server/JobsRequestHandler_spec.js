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
    const rawJob = {
      id: 'abc',
      _attempts: 0,
      constructor: { name: 'ResourceRequestJob' },
      arguments: { url: '/items.json' },
    };

    beforeEach(() => {
      spyOn(JobRegistry, 'jobsByStatus').and.returnValue([rawJob]);
    });

    it('calls jobsByStatus with the status param', () => {
      handler.handle({ params: { status: 'enqueued' } }, res);

      expect(JobRegistry.jobsByStatus).toHaveBeenCalledWith('enqueued');
    });

    it('responds with the serialized job list as JSON including jobClass', () => {
      handler.handle({ params: { status: 'enqueued' } }, res);

      expect(res.json).toHaveBeenCalledWith([{
        id: 'abc',
        status: 'enqueued',
        attempts: 0,
        jobClass: 'ResourceRequestJob',
        url: '/items.json',
      }]);
    });

    describe('when the status is unknown', () => {
      beforeEach(() => {
        JobRegistry.jobsByStatus.and.returnValue([]);
      });

      it('responds with an empty array', () => {
        handler.handle({ params: { status: 'unknown' } }, res);

        expect(res.json).toHaveBeenCalledWith([]);
      });
    });
  });
});
