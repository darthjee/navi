import { ConflictError } from '../../../../lib/exceptions/http/ConflictError.js';
import { Application } from '../../../../lib/services/application/Application.js';
import { EngineStopService } from '../../../../lib/services/engine/EngineStopService.js';

describe('EngineStopService', () => {
  describe('.stop', () => {
    let statusProvider;

    beforeEach(() => {
      statusProvider = {
        isRunning: jasmine.createSpy('isRunning'),
        stop: jasmine.createSpy('stop')
      };
    });

    describe('when the engine is running', () => {
      beforeEach(() => {
        statusProvider.isRunning.and.returnValue(true);
      });

      it('calls statusProvider.stop()', () => {
        EngineStopService.stop(statusProvider);
        expect(statusProvider.stop).toHaveBeenCalled();
      });

      it('returns the stopping status', () => {
        expect(EngineStopService.stop(statusProvider)).toEqual({ status: 'stopping' });
      });
    });

    describe('when the engine is not running', () => {
      beforeEach(() => {
        statusProvider.isRunning.and.returnValue(false);
      });

      it('throws a ConflictError', () => {
        expect(() => EngineStopService.stop(statusProvider)).toThrowError(ConflictError);
      });

      it('does not call statusProvider.stop()', () => {
        expect(() => EngineStopService.stop(statusProvider)).toThrow();
        expect(statusProvider.stop).not.toHaveBeenCalled();
      });
    });

    describe('when no statusProvider is given', () => {
      beforeEach(() => {
        spyOn(Application, 'isRunning').and.returnValue(true);
        spyOn(Application, 'stop');
      });

      afterEach(() => {
        Application.reset();
      });

      it('defaults to the Application facade', () => {
        EngineStopService.stop();
        expect(Application.stop).toHaveBeenCalled();
      });
    });
  });
});
