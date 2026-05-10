import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineContinueHandlerExecutor } from '../../../../../lib/server/handlers/engine/EngineContinueHandlerExecutor.js';
import { Application } from '../../../../../lib/services/Application.js';

describe('EngineContinueHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'continue').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineContinueHandlerExecutor({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when engine is paused', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('paused');
      });

      it('calls Application.continue()', async () => {
        await new EngineContinueHandlerExecutor({}, res).handle();
        expect(Application.continue).toHaveBeenCalled();
      });

      it('responds with running status', async () => {
        await new EngineContinueHandlerExecutor({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'running' });
      });
    });

    describe('when engine is not paused', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineContinueHandlerExecutor({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
