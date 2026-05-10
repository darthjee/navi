import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';

describe('RequestHandler', () => {
  describe('#handle', () => {
    it('is a no-op', () => {
      const handler = new RequestHandler();
      expect(() => handler.handle()).not.toThrow();
    });

    it('allows subclasses to override handle', () => {
      class MyHandler extends RequestHandler {
        handle() { this.result = 'ok'; }
      }
      const handler = new MyHandler();
      handler.handle();
      expect(handler.result).toBe('ok');
    });

    it('is an instance of RequestHandler when subclassed', () => {
      class MyHandler extends RequestHandler {}
      expect(new MyHandler()).toBeInstanceOf(RequestHandler);
    });
  });
});
