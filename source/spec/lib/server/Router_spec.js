import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { Router } from '../../../lib/server/Router.js';
import { EngineEvents } from '../../../lib/services/EngineEvents.js';
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
    EngineEvents.reset();
  });

  describe('#build', () => {
    it('returns an Express router', () => {
      const expressRouter = router.build();
      expect(typeof expressRouter).toEqual('function');
    });
  });
});
