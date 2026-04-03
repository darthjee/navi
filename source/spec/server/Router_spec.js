import { Router } from '../../lib/server/Router.js';

describe('Router', () => {
  let router;
  let jobRegistry;
  let workersRegistry;

  beforeEach(() => {
    jobRegistry = { stats: () => ({}) };
    workersRegistry = { stats: () => ({}) };
    router = new Router({ jobRegistry, workersRegistry });
  });

  describe('#build', () => {
    it('returns an Express router', () => {
      const expressRouter = router.build();
      expect(typeof expressRouter).toEqual('function');
    });
  });
});
