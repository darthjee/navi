import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { Router } from '../../../lib/server/Router.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('Router', () => {
  let router;

  beforeEach(() => {
    Logger.suppress();
    JobRegistry.build({ cooldown: -1 });
    LogRegistry.build();
    WorkersRegistry.build({ quantity: 0 });
    router = new Router();
  });

  afterEach(() => {
    JobRegistry.reset();
    LogRegistry.reset();
    Logger.reset();
    WorkersRegistry.reset();
  });

  describe('#build', () => {
    it('returns an Express router', () => {
      const expressRouter = router.build();
      expect(typeof expressRouter).toEqual('function');
    });

    it('registers GET /memory/status.json', () => {
      const expressRouter = router.build();
      const layer = expressRouter.stack.find((entry) => entry.route?.path === '/memory/status.json');

      expect(layer).toBeDefined();
      expect(layer.route.methods.get).toBeTrue();
    });

    it('registers GET /emissions.json', () => {
      const expressRouter = router.build();
      const layer = expressRouter.stack.find((entry) => entry.route?.path === '/emissions.json');

      expect(layer).toBeDefined();
      expect(layer.route.methods.get).toBeTrue();
    });
  });
});
