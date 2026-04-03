import { RequestHandler } from '../../lib/server/RequestHandler.js';

describe('RequestHandler', () => {
  describe('#handle', () => {
    it('is a no-op', () => {
      const handler = new RequestHandler();
      expect(() => handler.handle({}, {})).not.toThrow();
    });
  });
});
