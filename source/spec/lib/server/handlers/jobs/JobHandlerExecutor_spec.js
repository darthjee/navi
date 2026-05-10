import { JobRegistry } from '../../../../../lib/background/JobRegistry.js';
import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { NotFoundError } from '../../../../../lib/exceptions/http/NotFoundError.js';
import { JobHandlerExecutor } from '../../../../../lib/server/handlers/jobs/JobHandlerExecutor.js';

describe('JobHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new JobHandlerExecutor({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when the job exists', () => {
      const rawJob = {
        id: 'abc-123',
        _attempts: 1,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url: '/items.json', parameters: {} },
        maxRetries: 3,
        readyBy: 0,
      };

      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue({ job: rawJob, status: 'processing' });
      });

      it('calls jobById with the id param', () => {
        new JobHandlerExecutor({ params: { id: 'abc-123' } }, res).handle();
        expect(JobRegistry.jobById).toHaveBeenCalledWith('abc-123');
      });

      it('responds with serialized job data', () => {
        new JobHandlerExecutor({ params: { id: 'abc-123' } }, res).handle();
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
          id: 'abc-123',
          status: 'processing',
          attempts: 1,
          jobClass: 'ResourceRequestJob',
        }));
      });
    });

    describe('when the job does not exist', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue(null);
      });

      it('throws a NotFoundError', () => {
        expect(() => new JobHandlerExecutor({ params: { id: 'nonexistent' } }, res).handle())
          .toThrowError(NotFoundError);
      });
    });
  });
});
