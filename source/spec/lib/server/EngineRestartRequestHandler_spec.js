import { EngineRestartRequestHandler } from '../../../lib/server/EngineRestartRequestHandler.js';
import { Application } from '../../../lib/services/Application.js';
import { ConflictError } from '../../../lib/exceptions/ConflictError.js';

describe('EngineRestartRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    handler = new EngineRestartRequestHandler();
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    spyOn(Application, 'restart').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.restart()', async () => {
        await handler.handle({}, res);

        expect(Application.restart).toHaveBeenCalled();
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

      it('does not call Application.restart()', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));

        expect(Application.restart).not.toHaveBeenCalled();
      });

      it('throws a ConflictError', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
