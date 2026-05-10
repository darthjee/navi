import { RequestHandlerExecutor } from '../../../../../lib/common/server/RequestHandlerExecutor.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineRestartHandlerExecutor } from '../../../../../lib/server/handlers/engine/EngineRestartHandlerExecutor.js';
import { Application } from '../../../../../lib/services/Application.js';

describe('EngineRestartHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'restart');
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineRestartHandlerExecutor({}, res)).toBeInstanceOf(RequestHandlerExecutor);
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.restart()', async () => {
        await new EngineRestartHandlerExecutor({}, res).handle();
        expect(Application.restart).toHaveBeenCalled();
      });

      it('responds with stopping status', async () => {
        await new EngineRestartHandlerExecutor({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineRestartHandlerExecutor({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
