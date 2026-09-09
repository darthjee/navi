import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger } from '../../../../lib/common/utils/logging/Logger.js';
import { ExtensionsDirectoryMissing } from '../../../../lib/exceptions/config/ExtensionsDirectoryMissing.js';
import { ExtensionRoutesLoader } from '../../../../lib/server/extensions/ExtensionRoutesLoader.js';

const FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../support/fixtures/extensions',
);

describe('ExtensionRoutesLoader', () => {
  const originalEnv = { ...process.env };

  const enable = (subdir) => {
    process.env.NAVI_EXTENSIONS_ENABLED = 'true';
    process.env.NAVI_EXTENSIONS_DIR = path.join(FIXTURES, subdir);
  };

  beforeEach(() => {
    Logger.suppress();
    spyOn(Logger, 'warn').and.stub();
    spyOn(Logger, 'info').and.stub();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Logger.reset();
  });

  describe('when the feature is disabled', () => {
    beforeEach(() => {
      delete process.env.NAVI_EXTENSIONS_ENABLED;
    });

    it('returns an empty array', async () => {
      expect(await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() })).toEqual([]);
    });

    it('never reads the filesystem', async () => {
      const spy = spyOn(fs, 'readdirSync').and.callThrough();

      await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when enabled but the directory is missing', () => {
    beforeEach(() => {
      process.env.NAVI_EXTENSIONS_ENABLED = 'true';
      process.env.NAVI_EXTENSIONS_DIR = path.join(FIXTURES, 'does-not-exist');
    });

    it('rejects with ExtensionsDirectoryMissing', async () => {
      await expectAsync(ExtensionRoutesLoader.load({ stockRouteKeys: new Set() }))
        .toBeRejectedWithError(ExtensionsDirectoryMissing);
    });
  });

  describe('when enabled but backend/ is absent', () => {
    beforeEach(() => {
      process.env.NAVI_EXTENSIONS_ENABLED = 'true';
      process.env.NAVI_EXTENSIONS_DIR = FIXTURES;
    });

    it('returns an empty array', async () => {
      expect(await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() })).toEqual([]);
    });

    it('logs an info line', async () => {
      await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(Logger.info).toHaveBeenCalledWith(jasmine.stringMatching(/no backend extensions/));
    });
  });

  describe('happy path', () => {
    beforeEach(() => {
      enable('ok');
    });

    it('returns both descriptors in filename order', async () => {
      const routes = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(routes.map((route) => `${route.method} ${route.path}`))
        .toEqual(['GET /ext/health', 'POST /ext/reindex']);
    });

    it('returns descriptors without a source field', async () => {
      const [route] = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(Object.keys(route).sort()).toEqual(['handler', 'method', 'path']);
      expect(typeof route.handler).toBe('function');
    });

    it('logs the audit line listing both routes with their source filenames', async () => {
      await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(Logger.info).toHaveBeenCalledWith(
        '[extensions] loaded 2 backend route(s): GET /ext/health (a_health.js), POST /ext/reindex (b_reindex.js)',
      );
    });

    it('ignores non-.js siblings', async () => {
      const routes = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(routes.length).toBe(2);
    });
  });

  describe('with a module that throws on import', () => {
    beforeEach(() => {
      enable('broken-import');
    });

    it('skips the broken module but keeps the others', async () => {
      const routes = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(routes.map((route) => route.path)).toEqual(['/ext/survivor']);
    });

    it('warns about the broken module', async () => {
      await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringMatching(/skipping bad\.js/));
    });
  });

  describe('with a module whose export is not an array', () => {
    beforeEach(() => {
      enable('bad-shape');
    });

    it('returns no routes and warns', async () => {
      const routes = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(routes).toEqual([]);
      expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringMatching(/skipping no_array\.js/));
    });
  });

  describe('with an invalid descriptor', () => {
    beforeEach(() => {
      enable('bad-descriptor');
    });

    it('returns no routes and warns', async () => {
      const routes = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(routes).toEqual([]);
      expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringMatching(/skipping bad_method\.js/));
    });
  });

  describe('when a descriptor collides with a stock route', () => {
    beforeEach(() => {
      enable('collision-stock');
    });

    it('drops the extension route', async () => {
      const routes = await ExtensionRoutesLoader.load({
        stockRouteKeys: new Set(['GET /stats.json']),
      });

      expect(routes).toEqual([]);
    });

    it('warns that the path is a built-in route', async () => {
      await ExtensionRoutesLoader.load({ stockRouteKeys: new Set(['GET /stats.json']) });

      expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringMatching(/built-in Navi route/));
    });
  });

  describe('when two extension files declare the same route', () => {
    beforeEach(() => {
      enable('collision-extra');
    });

    it('keeps the first file lexicographically', async () => {
      const routes = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(routes.length).toBe(1);
      expect(routes[0].path).toBe('/ext/dup');
    });

    it('warns naming the first file', async () => {
      await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringMatching(/already registered by one\.js/));
    });
  });

  describe('with a symlink escaping the backend folder', () => {
    const linkPath = path.join(FIXTURES, 'traversal/backend/evil.js');

    beforeAll(() => {
      fs.symlinkSync('/etc/hosts', linkPath);
    });

    afterAll(() => {
      fs.rmSync(linkPath, { force: true });
    });

    beforeEach(() => {
      enable('traversal');
    });

    it('drops the symlink without throwing', async () => {
      const routes = await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(routes).toEqual([]);
    });

    it('warns that the path escapes backend/', async () => {
      await ExtensionRoutesLoader.load({ stockRouteKeys: new Set() });

      expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringMatching(/path escapes backend\//));
    });
  });
});
