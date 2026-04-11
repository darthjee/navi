import { WebConfig } from '../../../lib/models/WebConfig.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { WebServer } from '../../../lib/server/WebServer.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('WebServer', () => {
  beforeEach(() => {
    Logger.suppress();
    JobRegistry.build({ cooldown: -1 });
    WorkersRegistry.build({ quantity: 0 });
  });

  afterEach(() => {
    JobRegistry.reset();
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
});
