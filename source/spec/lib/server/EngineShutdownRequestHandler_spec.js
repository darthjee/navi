import { EngineShutdownRequestHandler } from '../../../lib/server/EngineShutdownRequestHandler.js';
import { Application } from '../../../lib/services/Application.js';

describe('EngineShutdownRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    handler = new EngineShutdownRequestHandler();
    res = {
      json:   jasmine.createSpy('json'),
      status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
    };
    spyOn(Application, 'shutdown').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  describe('#handle', () => {
    it('calls Application.shutdown()', () => {
      handler.handle({}, res);

      expect(Application.shutdown).toHaveBeenCalled();
    });

    it('responds with stopping status', () => {
      handler.handle({}, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
    });
  });
});
