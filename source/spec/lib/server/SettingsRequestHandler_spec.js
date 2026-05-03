import { SettingsRequestHandler } from '../../../lib/server/SettingsRequestHandler.js';

describe('SettingsRequestHandler', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
  });

  describe('#handle', () => {
    describe('when shutdown is enabled', () => {
      it('responds with enable_shutdown true', () => {
        const handler = new SettingsRequestHandler({ enableShutdown: true });
        handler.handle({}, res);
        expect(res.json).toHaveBeenCalledWith({ enable_shutdown: true });
      });
    });

    describe('when using default options', () => {
      it('responds with enable_shutdown true', () => {
        const handler = new SettingsRequestHandler();
        handler.handle({}, res);
        expect(res.json).toHaveBeenCalledWith({ enable_shutdown: true });
      });
    });

    describe('when shutdown is disabled', () => {
      it('throws ForbiddenError', () => {
        const handler = new SettingsRequestHandler({ enableShutdown: false });
        expect(() => handler.handle({}, res)).toThrowError('Forbidden');
      });
    });
  });
});
