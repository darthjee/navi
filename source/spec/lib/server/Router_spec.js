import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { Router } from '../../../lib/server/Router.js';

describe('Router', () => {
  let router;
  let workersRegistry;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    workersRegistry = { stats: () => ({}) };
    router = new Router({ workersRegistry });
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  describe('#build', () => {
    it('returns an Express router', () => {
      const expressRouter = router.build();
      expect(typeof expressRouter).toEqual('function');
    });
  });
});
