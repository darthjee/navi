import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { SettingsHandler } from '../../../../lib/server/handlers/SettingsHandler.js';

describe("describe('SettingsHandler'", () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new SettingsHandler({}, res, true)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when shutdown is enabled', () => {
      it('responds with enable_shutdown true', () => {
        new SettingsHandler({}, res, true).handle();
        expect(res.json).toHaveBeenCalledWith({ enable_shutdown: true });
      });
    });

    describe('when shutdown is disabled', () => {
      it('throws ForbiddenError', () => {
        expect(() => new SettingsHandler({}, res, false).handle())
          .toThrowError('Forbidden');
      });
    });
  });
});
