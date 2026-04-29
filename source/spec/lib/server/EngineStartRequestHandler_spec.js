import { ConflictError } from '../../../lib/exceptions/ConflictError.js';
import { EngineStartRequestHandler } from '../../../lib/server/EngineStartRequestHandler.js';
import { Application } from '../../../lib/services/Application.js';

describe('EngineStartRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    handler = new EngineStartRequestHandler();
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    spyOn(Application, 'start').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  describe('#handle', () => {
    describe('when engine is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('calls Application.start()', async () => {
        await handler.handle({}, res);

        expect(Application.start).toHaveBeenCalled();
      });

      it('responds with running status', async () => {
        await handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'running' });
      });
    });

    describe('when engine is not stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('does not call Application.start()', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));

        expect(Application.start).not.toHaveBeenCalled();
      });

      it('throws a ConflictError', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
