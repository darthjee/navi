import { WebServer } from '../../../../lib/server/WebServer.js';
import { ServerController } from '../../../../lib/services/engine/ServerController.js';

describe('ServerController', () => {
  describe('.build', () => {
    describe('when webConfig is undefined', () => {
      it('returns a ServerController instance', () => {
        const controller = ServerController.build({ webConfig: undefined });

        expect(controller).toBeInstanceOf(ServerController);
      });
    });

    it('calls buildWebServer and wraps its result', () => {
      const webServer = new WebServer({ webConfig: { port: 1234 } });
      spyOn(ServerController.prototype, 'buildWebServer').and.returnValue(webServer);
      spyOn(WebServer.prototype, 'start').and.returnValue('start-result');

      const controller = ServerController.build({ webConfig: { port: 1234 } });

      expect(ServerController.prototype.buildWebServer).toHaveBeenCalledWith({ webConfig: { port: 1234 } });
      expect(controller.start()).toBe('start-result');
    });
  });

  describe('#start', () => {
    describe('when a web server is present', () => {
      it('delegates to WebServer#start', () => {
        spyOn(WebServer.prototype, 'start').and.returnValue('start-result');
        const controller = ServerController.build({ webConfig: { port: 1234 } });

        const result = controller.start();

        expect(WebServer.prototype.start).toHaveBeenCalled();
        expect(result).toBe('start-result');
      });
    });

    describe('when there is no web server', () => {
      it('resolves to undefined without throwing', async () => {
        const controller = ServerController.build({ webConfig: undefined });

        const result = controller.start();

        expect(result).toBeUndefined();
        await expectAsync(Promise.resolve(result)).not.toBeRejected();
      });
    });
  });

  describe('#shutdown', () => {
    describe('when a web server is present', () => {
      it('delegates to WebServer#shutdown', () => {
        spyOn(WebServer.prototype, 'shutdown').and.returnValue('shutdown-result');
        const controller = ServerController.build({ webConfig: { port: 1234 } });

        const result = controller.shutdown();

        expect(WebServer.prototype.shutdown).toHaveBeenCalled();
        expect(result).toBe('shutdown-result');
      });
    });

    describe('when there is no web server', () => {
      it('does not throw', () => {
        const controller = ServerController.build({ webConfig: undefined });

        expect(() => controller.shutdown()).not.toThrow();
      });
    });
  });
});
