import { RouteRegister } from '../../lib/server/RouteRegister.js';

describe('RouteRegister', () => {
  let router;
  let register;

  beforeEach(() => {
    router = { get: jasmine.createSpy('get') };
    register = new RouteRegister(router);
  });

  describe('#register', () => {
    it('registers a GET route on the router', () => {
      const handler = { handle: jasmine.createSpy('handle') };

      register.register({ route: '/stats.json', handler });

      expect(router.get).toHaveBeenCalledWith('/stats.json', jasmine.any(Function));
    });

    it('calls handler.handle when the route is triggered', () => {
      const handler = { handle: jasmine.createSpy('handle') };
      const req = {};
      const res = {};

      register.register({ route: '/stats.json', handler });

      const callback = router.get.calls.mostRecent().args[1];
      callback(req, res);

      expect(handler.handle).toHaveBeenCalledWith(req, res);
    });
  });
});
