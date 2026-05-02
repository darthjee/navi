import http from 'http';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { WebConfig } from '../../../lib/models/WebConfig.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { WebServer } from '../../../lib/server/WebServer.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('WebServer', () => {
  beforeEach(() => {
    Logger.suppress();
    JobRegistry.build({ cooldown: -1 });
    LogRegistry.build();
    WorkersRegistry.build({ quantity: 0 });
  });

  afterEach(() => {
    JobRegistry.reset();
    LogRegistry.reset();
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
