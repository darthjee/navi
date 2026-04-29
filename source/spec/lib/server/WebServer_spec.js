import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { WebConfig } from '../../../lib/models/WebConfig.js';
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
    it('starts listening on the configured port', (done) => {
      const webConfig = new WebConfig({ port: 19999 });
      const server = WebServer.build({ webConfig });
      const httpServer = server.start();
      httpServer.close(done);
    });
  });

  describe('#shutdown', () => {
    it('closes the HTTP server', (done) => {
      const webConfig = new WebConfig({ port: 19998 });
      const server = WebServer.build({ webConfig });
      const httpServer = server.start();
      httpServer.on('close', done);
      server.shutdown();
    });

    it('does not throw when called before start', () => {
      const webConfig = new WebConfig({ port: 19997 });
      const server = WebServer.build({ webConfig });
      expect(() => server.shutdown()).not.toThrow();
    });
  });
});
