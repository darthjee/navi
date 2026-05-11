import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineStopHandler } from '../../../../../lib/server/handlers/engine/EngineStopHandler.js';
import { Application } from '../../../../../lib/services/Application.js';

describe("describe('EngineStopHandler'", () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'stop');
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineStopHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.stop()', async () => {
        await new EngineStopHandler({}, res).handle();
        expect(Application.stop).toHaveBeenCalled();
      });

      it('responds with stopping status', async () => {
        await new EngineStopHandler({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineStopHandler({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
