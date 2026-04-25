import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
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
      const job = { id: 'abc-123', status: 'processing', attempts: 1 };

      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue(job);
      });

      it('calls jobById with the id param', () => {
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(JobRegistry.jobById).toHaveBeenCalledWith('abc-123');
      });

      it('responds with the job data as JSON', () => {
        handler.handle({ params: { id: 'abc-123' } }, res);

        expect(res.json).toHaveBeenCalledWith(job);
      });
    });

    describe('when the job does not exist', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'jobById').and.returnValue(null);
      });

      it('responds with a 404 status', () => {
        handler.handle({ params: { id: 'nonexistent' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
      });

      it('responds with a not found error', () => {
        const jsonSpy = res.status.calls.mostRecent()?.returnValue?.json || jasmine.createSpy('json');
        res.status.and.returnValue({ json: jsonSpy });

        handler.handle({ params: { id: 'nonexistent' } }, res);

        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Job not found' });
      });
    });
  });
});
