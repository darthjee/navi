import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { NotFoundError } from '../../../lib/exceptions/NotFoundError.js';
import { JobRequestHandler } from '../../../lib/server/JobRequestHandler.js';

describe('JobRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    handler = new JobRequestHandler();
  });

  afterEach(() => {
    JobRegistry.reset();
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
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(JobRegistry.jobById).toHaveBeenCalledWith('abc-123');
      });

      it('responds with the serialized job data as JSON including show fields', () => {
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({
          id: 'abc-123',
          status: 'processing',
          attempts: 1,
          jobClass: 'ResourceRequestJob',
          arguments: { url: '/items.json', parameters: {} },
          remainingAttempts: 2,
        }));
      });
    });

    describe('when the job does not exist', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue(null);
      });

      it('throws a NotFoundError', () => {
        expect(() => handler.handle({ params: { id: 'nonexistent' } }, res))
          .toThrowError(NotFoundError);
      });

      it('throws with the job not found message', () => {
        expect(() => handler.handle({ params: { id: 'nonexistent' } }, res))
          .toThrowError('Job not found');
      });
    });
  });
});
