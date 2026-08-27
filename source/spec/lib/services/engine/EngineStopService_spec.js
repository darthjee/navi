import { ConflictError } from '../../../../lib/exceptions/http/ConflictError.js';
import { Application } from '../../../../lib/services/application/Application.js';
import { EngineStopService } from '../../../../lib/services/engine/EngineStopService.js';

describe('EngineStopService', () => {
  beforeEach(() => {
    spyOn(Application, 'stop');
  });

  afterEach(() => {
    Application.reset();
  });

  describe('.stop', () => {
    describe('when the engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'isRunning').and.returnValue(true);
      });

      it('calls Application.stop()', () => {
        EngineStopService.stop();
        expect(Application.stop).toHaveBeenCalled();
      });

      it('returns the stopping status', () => {
        expect(EngineStopService.stop()).toEqual({ status: 'stopping' });
      });
    });

    describe('when the engine is not running', () => {
      beforeEach(() => {
        spyOn(Application, 'isRunning').and.returnValue(false);
      });

      it('throws a ConflictError', () => {
        expect(() => EngineStopService.stop()).toThrowError(ConflictError);
      });

      it('does not call Application.stop()', () => {
        expect(() => EngineStopService.stop()).toThrow();
        expect(Application.stop).not.toHaveBeenCalled();
      });
    });
  });
});
