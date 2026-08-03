import { SecuredRequestHandler } from '../../../../../lib/common/server/SecuredRequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { ApiEngineStopHandler } from '../../../../../lib/server/handlers/api/ApiEngineStopHandler.js';
import { Application } from '../../../../../lib/services/Application.js';

describe('ApiEngineStopHandler', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'stop');
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of SecuredRequestHandler', () => {
    expect(new ApiEngineStopHandler({}, res, 'token')).toBeInstanceOf(SecuredRequestHandler);
  });

  describe('#process', () => {
    describe('when the engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'isRunning').and.returnValue(true);
      });

      it('calls Application.stop()', () => {
        new ApiEngineStopHandler({}, res, 'token').process();
        expect(Application.stop).toHaveBeenCalled();
      });

      it('responds with stopping status', () => {
        new ApiEngineStopHandler({}, res, 'token').process();
        expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
      });
    });

    describe('when the engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'isRunning').and.returnValue(false);
      });

      it('throws a ConflictError', () => {
        expect(() => new ApiEngineStopHandler({}, res, 'token').process())
          .toThrowError(ConflictError);
      });
    });
  });
});
