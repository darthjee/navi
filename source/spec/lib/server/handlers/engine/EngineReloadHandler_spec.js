import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineReloadHandler } from '../../../../../lib/server/handlers/engine/EngineReloadHandler.js';
import { Application } from '../../../../../lib/services/Application.js';

describe("describe('EngineReloadHandler'", () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'reload');
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineReloadHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.reload()', async () => {
        await new EngineReloadHandler({}, res).handle();
        expect(Application.reload).toHaveBeenCalled();
      });

      it('responds with stopping status', async () => {
        await new EngineReloadHandler({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineReloadHandler({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
