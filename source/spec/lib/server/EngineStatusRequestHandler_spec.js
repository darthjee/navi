import { EngineStatusRequestHandler } from '../../../lib/server/EngineStatusRequestHandler.js';
import { Application } from '../../../lib/services/Application.js';

describe('EngineStatusRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    handler = new EngineStatusRequestHandler();
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    Application.reset();
  });

  describe('#handle', () => {
    describe('when no application instance exists', () => {
      it('responds with running status', () => {
        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'running' });
      });
    });

    describe('when application instance exists', () => {
      beforeEach(() => {
        Application.build();
        spyOn(Application, 'status').and.returnValue('paused');
      });

      it('responds with the current status', () => {
        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ status: 'paused' });
      });
    });
  });
});
