import http from 'http';
import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { Logger } from '../../../lib/common/utils/logging/Logger.js';
import { MenuEntry } from '../../../lib/models/configs/MenuEntry.js';
import { WebConfig } from '../../../lib/models/configs/WebConfig.js';
import { EmissionRegistry } from '../../../lib/registry/EmissionRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { WebServer } from '../../../lib/server/WebServer.js';

describe('WebServer', () => {
  beforeEach(() => {
    Logger.suppress();
    JobRegistry.build({ cooldown: -1 });
    LogRegistry.build();
    EmissionRegistry.build();
    WorkersRegistry.build({ quantity: 0 });
  });

  afterEach(() => {
    JobRegistry.reset();
    LogRegistry.reset();
    EmissionRegistry.reset();
    Logger.reset();
    WorkersRegistry.reset();
  });

  describe('.build', () => {
    describe('when webConfig is null', () => {
      it('returns null', () => {
        const result = WebServer.build({ webConfig: null });
        expect(result).toBeNull();
      });
    });

    describe('when webConfig is provided', () => {
      it('returns a WebServer instance', () => {
        const webConfig = new WebConfig({ port: 3000 });
        const result = WebServer.build({ webConfig });
        expect(result instanceof WebServer).toBeTrue();
      });
    });
  });

  describe('menu config threading', () => {
    it('serves the configured menu entries at GET /menu.json', async () => {
      const webConfig = new WebConfig({ port: 19995 });
      const menuConfig = [
        new MenuEntry({ route: '/custom', text: 'Custom' }),
        new MenuEntry({ route: '/logs' }),
      ];
      const server = WebServer.build({ webConfig, menuConfig });
      const serverPromise = server.start();

      const body = await new Promise((resolve, reject) => {
        http.get('http://localhost:19995/menu.json', (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });

      expect(JSON.parse(body)).toEqual({
        entries: [
          { route: '/custom', text: 'Custom' },
          { route: '/logs', text: '/logs' },
        ],
      });

      server.shutdown();
      await serverPromise;
    });
  });

  describe('#start', () => {
    it('returns a Promise that resolves when the server closes', async () => {
      const webConfig = new WebConfig({ port: 19999 });
      const server = WebServer.build({ webConfig });
      const promise = server.start();
      server.shutdown();
      await promise;
    });

    it('returns a Promise that rejects when the server fails to start', async () => {
      const webConfig = new WebConfig({ port: 19999 });
      const server1 = WebServer.build({ webConfig });
      const server2 = WebServer.build({ webConfig });
      const promise1 = server1.start();
      await expectAsync(server2.start()).toBeRejected();
      server1.shutdown();
      await promise1;
    });
  });

  describe('#shutdown', () => {
    it('closes the HTTP server', async () => {
      const webConfig = new WebConfig({ port: 19998 });
      const server = WebServer.build({ webConfig });
      const promise = server.start();
      server.shutdown();
      await promise;
    });

    it('does not throw when called before start', () => {
      const webConfig = new WebConfig({ port: 19997 });
      const server = WebServer.build({ webConfig });
      expect(() => server.shutdown()).not.toThrow();
    });

    it('resolves the start promise even with an open keep-alive connection', async () => {
      const webConfig = new WebConfig({ port: 19996 });
      const server = WebServer.build({ webConfig });
      const serverPromise = server.start();

      await new Promise((resolve, reject) => {
        const req = http.get(
          'http://localhost:19996/stats.json',
          { headers: { connection: 'keep-alive' } },
          (res) => { res.resume(); resolve(); }
        );
        req.on('error', reject);
      });

      server.shutdown();
      await serverPromise;
    });
  });
});
