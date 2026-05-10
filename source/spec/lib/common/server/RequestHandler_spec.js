import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';

describe('RequestHandler', () => {
  describe('#handle', () => {
    it('is a no-op', () => {
      const handler = new RequestHandler();
      expect(() => handler.handle({}, {})).not.toThrow();
    });

    it('allows subclasses to override handle', () => {
      class MyHandler extends RequestHandler {
        handle(_req, res) { res.result = 'ok'; }
      }
      const handler = new MyHandler();
      const res = {};
      handler.handle({}, res);
      expect(res.result).toBe('ok');
    });

    it('is an instance of RequestHandler when subclassed', () => {
      class MyHandler extends RequestHandler {}
      expect(new MyHandler()).toBeInstanceOf(RequestHandler);
    });
  });
});
