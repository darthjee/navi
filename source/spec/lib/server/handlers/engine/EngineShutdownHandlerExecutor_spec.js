import { RequestHandlerExecutor } from '../../../../../lib/common/server/RequestHandlerExecutor.js';
import { EngineShutdownHandlerExecutor } from '../../../../../lib/server/handlers/engine/EngineShutdownHandlerExecutor.js';
import { Application } from '../../../../../lib/services/Application.js';

describe('EngineShutdownHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'shutdown').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineShutdownHandlerExecutor({}, res)).toBeInstanceOf(RequestHandlerExecutor);
  });

  describe('#handle', () => {
    it('calls Application.shutdown()', () => {
      new EngineShutdownHandlerExecutor({}, res).handle();
      expect(Application.shutdown).toHaveBeenCalled();
    });

    it('responds with stopping status', () => {
      new EngineShutdownHandlerExecutor({}, res).handle();
      expect(res.json).toHaveBeenCalledWith({ status: 'stopping' });
    });
  });
});
