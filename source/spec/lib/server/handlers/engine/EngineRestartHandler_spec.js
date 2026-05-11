import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineRestartHandler } from '../../../../../lib/server/handlers/engine/EngineRestartHandler.js';
import { Application } from '../../../../../lib/services/Application.js';

describe("describe('EngineRestartHandler'", () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'restart');
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineRestartHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.restart()', async () => {
        await new EngineRestartHandler({}, res).handle();
        expect(Application.restart).toHaveBeenCalled();
      });

      it('responds with stopping status', async () => {
        await new EngineRestartHandler({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineRestartHandler({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
