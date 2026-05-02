import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { ConflictError } from '../../../lib/exceptions/ConflictError.js';
import { NotFoundError } from '../../../lib/exceptions/NotFoundError.js';
import { JobRetryRequestHandler } from '../../../lib/server/JobRetryRequestHandler.js';

describe('JobRetryRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    handler = new JobRetryRequestHandler();
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  describe('#handle', () => {
    describe('when the job is in the failed queue', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue({ job: {}, status: 'failed' });
        spyOn(JobRegistry, 'retryJob').and.stub();
      });

      it('calls retryJob with the id param', () => {
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(JobRegistry.retryJob).toHaveBeenCalledWith('abc-123');
      });

      it('responds with enqueued status', () => {
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'enqueued' });
      });
    });

    describe('when the job is in the dead queue', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue({ job: {}, status: 'dead' });
        spyOn(JobRegistry, 'retryJob').and.stub();
      });

      it('calls retryJob with the id param', () => {
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(JobRegistry.retryJob).toHaveBeenCalledWith('abc-123');
      });

      it('responds with enqueued status', () => {
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'enqueued' });
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
    });

    describe('when the job is in a non-retryable state', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue({ job: {}, status: 'processing' });
        spyOn(JobRegistry, 'retryJob').and.stub();
      });

      it('throws a ConflictError', () => {
        expect(() => handler.handle({ params: { id: 'abc-123' } }, res))
          .toThrowError(ConflictError);
      });

      it('does not call retryJob', () => {
        try { handler.handle({ params: { id: 'abc-123' } }, res); } catch (_) { /* expected */ }

        expect(JobRegistry.retryJob).not.toHaveBeenCalled();
      });
    });
  });
});
