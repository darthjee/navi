import { ConflictError } from '../../../lib/exceptions/ConflictError.js';
import { EngineStopRequestHandler } from '../../../lib/server/EngineStopRequestHandler.js';
import { Application } from '../../../lib/services/Application.js';

describe('EngineStopRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    handler = new EngineStopRequestHandler();
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    spyOn(Application, 'stop').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.stop()', async () => {
        await handler.handle({}, res);

        expect(Application.stop).toHaveBeenCalled();
      });

      it('responds with stopping status', async () => {
        await handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('does not call Application.stop()', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));

        expect(Application.stop).not.toHaveBeenCalled();
      });

      it('throws a ConflictError', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
