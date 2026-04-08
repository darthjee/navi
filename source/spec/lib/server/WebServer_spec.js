import { WebConfig } from '../../../lib/models/WebConfig.js';
import { WebServer } from '../../../lib/server/WebServer.js';

describe('WebServer', () => {
  let jobRegistry;
  let workersRegistry;

  beforeEach(() => {
    jobRegistry = { stats: () => ({}) };
    workersRegistry = { stats: () => ({}) };
  });

  describe('.build', () => {
    describe('when webConfig is null', () => {
      it('returns null', () => {
        const result = WebServer.build({ webConfig: null, jobRegistry, workersRegistry });
        expect(result).toBeNull();
      });
    });

    describe('when webConfig is provided', () => {
      it('returns a WebServer instance', () => {
        const webConfig = new WebConfig({ port: 3000 });
        const result = WebServer.build({ webConfig, jobRegistry, workersRegistry });
        expect(result instanceof WebServer).toBeTrue();
      });
    });
  });

  describe('#start', () => {
    it('starts listening on the configured port', (done) => {
      const webConfig = new WebConfig({ port: 19999 });
      const server = WebServer.build({ webConfig, jobRegistry, workersRegistry });
      const httpServer = server.start();
      httpServer.close(done);
    });
  });
});
