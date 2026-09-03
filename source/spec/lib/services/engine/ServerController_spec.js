import { WebServer } from '../../../../lib/server/WebServer.js';
import { ServerController } from '../../../../lib/services/engine/ServerController.js';
import { MemorySampler } from '../../../../lib/services/memory/MemorySampler.js';

describe('ServerController', () => {
  const buildFakeSampler = () => jasmine.createSpyObj('MemorySampler', ['start', 'stop']);

  describe('#buildSampler', () => {
    it('returns null when webConfig is undefined', () => {
      const controller = new ServerController();

      expect(controller.buildSampler({ webConfig: undefined })).toBeNull();
    });

    it('returns a MemorySampler built from webConfig.memory when webConfig is present', () => {
      const controller = new ServerController();
      const memory = { dataStoreInterval: 5, maximum: 1024 };

      expect(controller.buildSampler({ webConfig: { memory } })).toBeInstanceOf(MemorySampler);
    });
  });

  describe('.build', () => {
    describe('when webConfig is undefined', () => {
      it('returns a ServerController instance', () => {
        const controller = ServerController.build({ webConfig: undefined });

        expect(controller).toBeInstanceOf(ServerController);
      });

      it('does not construct a sampler (buildSampler returns null)', () => {
        const controller = ServerController.build({ webConfig: undefined });

        expect(controller.buildSampler({ webConfig: undefined })).toBeNull();
      });
    });

    it('calls buildWebServer and wraps its result', () => {
      const webServer = new WebServer({ webConfig: { port: 1234 } });
      spyOn(ServerController.prototype, 'buildWebServer').and.returnValue(webServer);
      spyOn(ServerController.prototype, 'buildSampler').and.returnValue(buildFakeSampler());
      spyOn(WebServer.prototype, 'start').and.returnValue('start-result');

      const controller = ServerController.build({ webConfig: { port: 1234 } });

      expect(ServerController.prototype.buildWebServer).toHaveBeenCalledWith({ webConfig: { port: 1234 } });
      expect(controller.start()).toBe('start-result');
    });

    it('calls buildSampler and wraps its result', () => {
      const fakeSampler = buildFakeSampler();
      spyOn(ServerController.prototype, 'buildWebServer').and.returnValue(null);
      spyOn(ServerController.prototype, 'buildSampler').and.returnValue(fakeSampler);

      const controller = ServerController.build({ webConfig: { port: 1234 } });
      controller.start();

      expect(ServerController.prototype.buildSampler).toHaveBeenCalledWith({ webConfig: { port: 1234 } });
      expect(fakeSampler.start).toHaveBeenCalled();
    });
  });

  describe('#start', () => {
    describe('when a web server is present', () => {
      it('delegates to WebServer#start', () => {
        spyOn(ServerController.prototype, 'buildSampler').and.returnValue(buildFakeSampler());
        spyOn(WebServer.prototype, 'start').and.returnValue('start-result');
        const controller = ServerController.build({ webConfig: { port: 1234 } });

        const result = controller.start();

        expect(WebServer.prototype.start).toHaveBeenCalled();
        expect(result).toBe('start-result');
      });

      it('also starts the sampler', () => {
        const fakeSampler = buildFakeSampler();
        spyOn(ServerController.prototype, 'buildSampler').and.returnValue(fakeSampler);
        spyOn(WebServer.prototype, 'start').and.returnValue('start-result');
        const controller = ServerController.build({ webConfig: { port: 1234 } });

        controller.start();

        expect(fakeSampler.start).toHaveBeenCalled();
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
        spyOn(ServerController.prototype, 'buildSampler').and.returnValue(buildFakeSampler());
        spyOn(WebServer.prototype, 'shutdown').and.returnValue('shutdown-result');
        const controller = ServerController.build({ webConfig: { port: 1234 } });

        const result = controller.shutdown();

        expect(WebServer.prototype.shutdown).toHaveBeenCalled();
        expect(result).toBe('shutdown-result');
      });

      it('stops the sampler before shutting down the web server', () => {
        const fakeSampler = buildFakeSampler();
        spyOn(ServerController.prototype, 'buildSampler').and.returnValue(fakeSampler);
        const callOrder = [];
        spyOn(WebServer.prototype, 'shutdown').and.callFake(() => {
          callOrder.push('webServer.shutdown');
          return 'shutdown-result';
        });
        fakeSampler.stop.and.callFake(() => callOrder.push('sampler.stop'));
        const controller = ServerController.build({ webConfig: { port: 1234 } });

        controller.shutdown();

        expect(callOrder).toEqual(['sampler.stop', 'webServer.shutdown']);
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
