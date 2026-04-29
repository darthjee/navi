import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { Router } from '../../../lib/server/Router.js';
import { Client } from '../../../lib/services/Client.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('Router', () => {
  let router;

  beforeEach(() => {
    ClientRegistry.build({ default: new Client({ name: 'default', baseUrl: 'https://example.com' }) });
    JobRegistry.build({ cooldown: -1 });
    LogRegistry.build();
    WorkersRegistry.build({ quantity: 0 });
    router = new Router();
  });

  afterEach(() => {
    ClientRegistry.reset();
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
  });
});
