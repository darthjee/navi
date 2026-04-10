import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { Router } from '../../../lib/server/Router.js';

describe('Router', () => {
  let router;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    WorkersRegistry.build({ quantity: 0 });
    router = new Router();
  });

  afterEach(() => {
    JobRegistry.reset();
    WorkersRegistry.reset();
  });

  describe('#build', () => {
    it('returns an Express router', () => {
      const expressRouter = router.build();
      expect(typeof expressRouter).toEqual('function');
    });
  });
});
