import { Job, JobRegistry } from 'deku-swarm';
import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { NotFoundError } from '../../../../../lib/exceptions/http/NotFoundError.js';
import { JobHandler } from '../../../../../lib/server/handlers/jobs/JobHandler.js';

describe("describe('JobHandler'", () => {
  let res;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new JobHandler({}, res)).toBeInstanceOf(RequestHandler);
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
        new JobHandler({ params: { id: 'abc-123' } }, res).handle();
        expect(JobRegistry.jobById).toHaveBeenCalledWith('abc-123');
      });

      it('responds with serialized job data', () => {
        new JobHandler({ params: { id: 'abc-123' } }, res).handle();
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
          id: 'abc-123',
          status: 'processing',
          attempts: 1,
          jobClass: 'ResourceRequestJob',
          endedAt: null,
        }));
      });
    });

    describe('when the job was finished through the registry', () => {
      beforeEach(() => {
        JobRegistry.finish(new Job({ id: 'fin-1' }));
      });

      it('exposes endedAt as an ISO string', () => {
        new JobHandler({ params: { id: 'fin-1' } }, res).handle();
        expect(res.json.calls.mostRecent().args[0].endedAt)
          .toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('when the job does not exist', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue(null);
      });

      it('throws a NotFoundError', () => {
        expect(() => new JobHandler({ params: { id: 'nonexistent' } }, res).handle())
          .toThrowError(NotFoundError);
      });
    });
  });
});
