import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { Logger } from '../../../lib/common/utils/logging/Logger.js';
import { MenuEntry } from '../../../lib/models/configs/MenuEntry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { Router, STOCK_ROUTE_KEYS } from '../../../lib/server/Router.js';

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

    describe('frontend extension routes', () => {
      const originalEnv = { ...process.env };

      afterEach(() => {
        process.env = { ...originalEnv };
      });

      it('registers GET /extensions/frontend.json', () => {
        const expressRouter = router.build();
        const layer = expressRouter.stack
          .find((entry) => entry.route?.path === '/extensions/frontend.json');

        expect(layer).toBeDefined();
        expect(layer.route.methods.get).toBeTrue();
      });

      it('registers GET /extensions/frontend/*path', () => {
        const expressRouter = router.build();
        const layer = expressRouter.stack
          .find((entry) => entry.route?.path === '/extensions/frontend/*path');

        expect(layer).toBeDefined();
        expect(layer.route.methods.get).toBeTrue();
      });

      it('serves an empty manifest when extensions are disabled', () => {
        delete process.env.NAVI_EXTENSIONS_ENABLED;
        const expressRouter = router.build();
        const layer = expressRouter.stack
          .find((entry) => entry.route?.path === '/extensions/frontend.json');
        const res = { json: jasmine.createSpy('json') };

        layer.route.stack[0].handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ bundles: [] });
      });

      it('404s the asset route when extensions are disabled', () => {
        delete process.env.NAVI_EXTENSIONS_ENABLED;
        const expressRouter = router.build();
        const layer = expressRouter.stack
          .find((entry) => entry.route?.path === '/extensions/frontend/*path');
        const json = jasmine.createSpy('json');
        const res = {
          sendFile: jasmine.createSpy('sendFile'),
          status: jasmine.createSpy('status').and.returnValue({ json }),
        };

        layer.route.stack[0].handle({ method: 'GET', path: '/extensions/frontend/a.js', params: { path: 'a.js' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.sendFile).not.toHaveBeenCalled();
      });
    });

    describe('extension routes', () => {
      let handleSpy;
      let ExtHandler;

      beforeEach(() => {
        handleSpy = jasmine.createSpy('handle');
        ExtHandler = class {
          handle(...args) {
            handleSpy(...args);
          }
        };
      });

      const buildWith = (descriptor) => new Router({ extensionRoutes: [descriptor] }).build();

      it('registers a GET extension descriptor', () => {
        const expressRouter = buildWith({ method: 'GET', path: '/ext/x.json', handler: ExtHandler });
        const layer = expressRouter.stack.find((entry) => entry.route?.path === '/ext/x.json');

        expect(layer.route.methods.get).toBeTrue();
      });

      it('routes the GET extension descriptor to its handler', () => {
        const expressRouter = buildWith({ method: 'GET', path: '/ext/x.json', handler: ExtHandler });
        const layer = expressRouter.stack.find((entry) => entry.route?.path === '/ext/x.json');

        layer.route.stack[0].handle({}, { json: () => {} });

        expect(handleSpy).toHaveBeenCalled();
      });

      it('registers a PATCH extension descriptor', () => {
        const expressRouter = buildWith({ method: 'PATCH', path: '/ext/y', handler: ExtHandler });
        const layer = expressRouter.stack.find((entry) => entry.route?.path === '/ext/y');

        expect(layer.route.methods.patch).toBeTrue();
      });

      it('registers a POST extension descriptor', () => {
        const expressRouter = buildWith({ method: 'POST', path: '/ext/z', handler: ExtHandler });
        const layer = expressRouter.stack.find((entry) => entry.route?.path === '/ext/z');

        expect(layer.route.methods.post).toBeTrue();
      });

      it('registers extension routes after the stock routes', () => {
        const expressRouter = buildWith({ method: 'GET', path: '/ext/x.json', handler: ExtHandler });
        const stack = expressRouter.stack;
        const extIndex = stack.findIndex((entry) => entry.route?.path === '/ext/x.json');
        const statsIndex = stack.findIndex((entry) => entry.route?.path === '/stats.json');

        expect(extIndex).toBeGreaterThan(statsIndex);
      });

      it('registers extension routes before the static / catch-all middleware', () => {
        const expressRouter = buildWith({ method: 'GET', path: '/ext/x.json', handler: ExtHandler });
        const stack = expressRouter.stack;
        const extIndex = stack.findIndex((entry) => entry.route?.path === '/ext/x.json');
        const routeIndices = stack
          .map((entry, index) => (entry.route ? index : -1))
          .filter((index) => index >= 0);

        expect(Math.max(...routeIndices)).toBe(extIndex);
        expect(stack.slice(extIndex + 1).every((entry) => !entry.route)).toBeTrue();
      });

      it('registers no extra routes by default', () => {
        const routePaths = router.build().stack
          .filter((entry) => entry.route)
          .map((entry) => entry.route.path);

        expect(routePaths).not.toContain('/ext/x.json');
        expect(routePaths.length).toBe(STOCK_ROUTE_KEYS.size);
      });
    });
  });

  describe('STOCK_ROUTE_KEYS', () => {
    it('matches every route registered by build()', () => {
      const keys = new Set();

      router.build().stack.forEach((layer) => {
        if (!layer.route) return;

        Object.keys(layer.route.methods).forEach((method) => {
          keys.add(`${method.toUpperCase()} ${layer.route.path}`);
        });
      });

      expect(keys).toEqual(STOCK_ROUTE_KEYS);
    });

    it('is frozen', () => {
      expect(Object.isFrozen(STOCK_ROUTE_KEYS)).toBeTrue();
    });
  });
});
