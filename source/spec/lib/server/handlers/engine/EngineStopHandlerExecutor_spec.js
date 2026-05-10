import { RequestHandlerExecutor } from '../../../../../lib/common/server/RequestHandlerExecutor.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineStopHandlerExecutor } from '../../../../../lib/server/handlers/engine/EngineStopHandlerExecutor.js';
import { Application } from '../../../../../lib/services/Application.js';

describe('EngineStopHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'stop');
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineStopHandlerExecutor({}, res)).toBeInstanceOf(RequestHandlerExecutor);
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.stop()', async () => {
        await new EngineStopHandlerExecutor({}, res).handle();
        expect(Application.stop).toHaveBeenCalled();
      });

      it('responds with stopping status', async () => {
        await new EngineStopHandlerExecutor({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineStopHandlerExecutor({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
