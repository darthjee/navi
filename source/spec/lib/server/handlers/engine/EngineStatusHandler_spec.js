import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { EngineStatusHandler } from '../../../../../lib/server/handlers/engine/EngineStatusHandler.js';
import { Application } from '../../../../../lib/services/Application.js';

describe("describe('EngineStatusHandler'", () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineStatusHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when no application instance exists', () => {
      it('responds with running status', () => {
        new EngineStatusHandler({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'running' });
      });
    });

    describe('when application instance exists', () => {
      beforeEach(() => {
        Application.build();
        spyOn(Application, 'status').and.returnValue('paused');
      });

      it('responds with the current status', () => {
        new EngineStatusHandler({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'paused' });
      });
    });
  });
});
