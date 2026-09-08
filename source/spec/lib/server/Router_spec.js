import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { Logger } from '../../../lib/common/utils/logging/Logger.js';
import { MenuEntry } from '../../../lib/models/configs/MenuEntry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { Router } from '../../../lib/server/Router.js';

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

    it('registers GET /memory/history.json', () => {
      const expressRouter = router.build();
      const layer = expressRouter.stack.find((entry) => entry.route?.path === '/memory/history.json');

      expect(layer).toBeDefined();
      expect(layer.route.methods.get).toBeTrue();
    });

    it('registers GET /menu.json', () => {
      const expressRouter = router.build();
      const layer = expressRouter.stack.find((entry) => entry.route?.path === '/menu.json');

      expect(layer).toBeDefined();
      expect(layer.route.methods.get).toBeTrue();
    });

    it('routes GET /menu.json to a handler built from the menu config', () => {
      const menuConfig = [new MenuEntry({ route: '/logs', text: 'Logs' })];
      const expressRouter = new Router({ menuConfig }).build();
      const layer = expressRouter.stack.find((entry) => entry.route?.path === '/menu.json');
      const res = { json: jasmine.createSpy('json') };

      layer.route.stack[0].handle({}, res);

      expect(res.json).toHaveBeenCalledWith({ entries: [{ route: '/logs', text: 'Logs' }] });
    });

    it('registers GET /emissions.json', () => {
      const expressRouter = router.build();
      const layer = expressRouter.stack.find((entry) => entry.route?.path === '/emissions.json');

      expect(layer).toBeDefined();
      expect(layer.route.methods.get).toBeTrue();
    });

    it('registers GET /extractions.json', () => {
      const expressRouter = router.build();
      const layer = expressRouter.stack.find((entry) => entry.route?.path === '/extractions.json');

      expect(layer).toBeDefined();
      expect(layer.route.methods.get).toBeTrue();
    });
  });
});
