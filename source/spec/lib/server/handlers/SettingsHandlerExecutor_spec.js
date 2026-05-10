import { RequestHandlerExecutor } from '../../../../lib/common/server/RequestHandlerExecutor.js';
import { SettingsHandlerExecutor } from '../../../../lib/server/handlers/SettingsHandlerExecutor.js';

describe('SettingsHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new SettingsHandlerExecutor({}, res, true)).toBeInstanceOf(RequestHandlerExecutor);
  });

  describe('#handle', () => {
    describe('when shutdown is enabled', () => {
      it('responds with enable_shutdown true', () => {
        new SettingsHandlerExecutor({}, res, true).handle();
        expect(res.json).toHaveBeenCalledWith({ enable_shutdown: true });
      });
    });

    describe('when shutdown is disabled', () => {
      it('throws ForbiddenError', () => {
        expect(() => new SettingsHandlerExecutor({}, res, false).handle())
          .toThrowError('Forbidden');
      });
    });
  });
});
