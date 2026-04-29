import { EnginePauseRequestHandler } from '../../../lib/server/EnginePauseRequestHandler.js';
import { Application } from '../../../lib/services/Application.js';
import { ConflictError } from '../../../lib/exceptions/ConflictError.js';

describe('EnginePauseRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    handler = new EnginePauseRequestHandler();
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    spyOn(Application, 'pause').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  describe('#handle', () => {
    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('calls Application.pause()', async () => {
        await handler.handle({}, res);

        expect(Application.pause).toHaveBeenCalled();
      });

      it('responds with pausing status', async () => {
        await handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'pausing' });
      });
    });

    describe('when engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('paused');
      });

      it('does not call Application.pause()', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));

        expect(Application.pause).not.toHaveBeenCalled();
      });

      it('throws a ConflictError', async () => {
        await expectAsync(handler.handle({}, res)).toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
