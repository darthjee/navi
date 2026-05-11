import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { EngineShutdownHandler } from '../../../../../lib/server/handlers/engine/EngineShutdownHandler.js';
import { Application } from '../../../../../lib/services/Application.js';

describe("describe('EngineShutdownHandler'", () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'shutdown').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineShutdownHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    it('calls Application.shutdown()', () => {
      new EngineShutdownHandler({}, res).handle();
      expect(Application.shutdown).toHaveBeenCalled();
    });

    it('responds with stopping status', () => {
      new EngineShutdownHandler({}, res).handle();
      expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
    });
  });
});
