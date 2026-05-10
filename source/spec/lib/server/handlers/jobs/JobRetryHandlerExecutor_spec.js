import { JobRegistry } from '../../../../../lib/background/JobRegistry.js';
import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { NotFoundError } from '../../../../../lib/exceptions/http/NotFoundError.js';
import { JobRetryHandlerExecutor } from '../../../../../lib/server/handlers/jobs/JobRetryHandlerExecutor.js';

describe('JobRetryHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new JobRetryHandlerExecutor({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when the job is in the failed queue', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue({ job: {}, status: 'failed' });
        spyOn(JobRegistry, 'retryJob').and.stub();
      });

      it('calls retryJob with the id param', () => {
        new JobRetryHandlerExecutor({ params: { id: 'abc-123' } }, res).handle();
        expect(JobRegistry.retryJob).toHaveBeenCalledWith('abc-123');
      });

      it('responds with enqueued status', () => {
        new JobRetryHandlerExecutor({ params: { id: 'abc-123' } }, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'enqueued' });
      });
    });

    describe('when the job is in the dead queue', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue({ job: {}, status: 'dead' });
        spyOn(JobRegistry, 'retryJob').and.stub();
      });

      it('responds with enqueued status', () => {
        new JobRetryHandlerExecutor({ params: { id: 'abc-123' } }, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'enqueued' });
      });
    });

    describe('when the job does not exist', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue(null);
      });

      it('throws a NotFoundError', () => {
        expect(() => new JobRetryHandlerExecutor({ params: { id: 'nonexistent' } }, res).handle())
          .toThrowError(NotFoundError);
      });
    });

    describe('when the job is in a non-retryable state', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue({ job: {}, status: 'processing' });
        spyOn(JobRegistry, 'retryJob').and.stub();
      });

      it('throws a ConflictError', () => {
        expect(() => new JobRetryHandlerExecutor({ params: { id: 'abc-123' } }, res).handle())
          .toThrowError(ConflictError);
      });

      it('does not call retryJob', () => {
        try { new JobRetryHandlerExecutor({ params: { id: 'abc-123' } }, res).handle(); } catch (_) { /* expected */ }
        expect(JobRegistry.retryJob).not.toHaveBeenCalled();
      });
    });
  });
});
