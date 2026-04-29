import { EngineContinueRequestHandler } from '../../../lib/server/EngineContinueRequestHandler.js';
import { Application } from '../../../lib/services/Application.js';

describe('EngineContinueRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    handler = new EngineContinueRequestHandler();
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    spyOn(Application, 'continue').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  describe('#handle', () => {
    describe('when engine is paused', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('paused');
      });

      it('calls Application.continue()', async () => {
        await handler.handle({}, res);

        expect(Application.continue).toHaveBeenCalled();
      });

      it('responds with running status', async () => {
        await handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'running' });
      });
    });

    describe('when engine is not paused', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('does not call Application.continue()', async () => {
        await handler.handle({}, res);

        expect(Application.continue).not.toHaveBeenCalled();
      });

      it('responds with 409 Conflict', async () => {
        await handler.handle({}, res);

        expect(res.status).toHaveBeenCalledWith(409);
      });
    });
  });
});
