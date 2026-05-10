import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EnginePauseHandlerExecutor } from '../../../../../lib/server/handlers/engine/EnginePauseHandlerExecutor.js';
import { Application } from '../../../../../lib/services/Application.js';

describe('EnginePauseHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'pause');
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EnginePauseHandlerExecutor({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.pause()', async () => {
        await new EnginePauseHandlerExecutor({}, res).handle();
        expect(Application.pause).toHaveBeenCalled();
      });

      it('responds with pausing status', async () => {
        await new EnginePauseHandlerExecutor({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'pausing' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('paused');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EnginePauseHandlerExecutor({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
