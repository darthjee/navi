import { StartupCoordinator } from '../../../../lib/services/application/StartupCoordinator.js';

describe('StartupCoordinator', () => {
  let coordinator;

  beforeEach(() => {
    coordinator = new StartupCoordinator();
  });

  describe('#startAll', () => {
    it('calls start() on each controller in order', () => {
      const calls = [];
      const controllerA = { start: () => calls.push('A') };
      const controllerB = { start: () => calls.push('B') };

      coordinator.startAll([controllerA, controllerB]);

      expect(calls).toEqual(['A', 'B']);
    });

    it('registers each controller start() promise with the internal aggregator', async () => {
      let resolved = false;
      const controller = {
        start: () => new Promise((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve();
          }, 10);
        }),
      };

      coordinator.startAll([controller]);

      await coordinator.wait();

      expect(resolved).toBeTrue();
    });

    it('tolerates null/undefined return values from a controller start()', () => {
      const controllerA = { start: () => null };
      const controllerB = { start: () => undefined };

      expect(() => coordinator.startAll([controllerA, controllerB])).not.toThrow();
    });

    it('is a no-op for an empty controller list', async () => {
      expect(() => coordinator.startAll([])).not.toThrow();
      await expectAsync(coordinator.wait()).toBeResolved();
    });

    it('propagates a synchronous throw from one controller start() and prevents later controllers from starting', () => {
      const error = new Error('boom');
      const controllerA = { start: () => { throw error; } };
      const controllerB = { start: jasmine.createSpy('start') };

      expect(() => coordinator.startAll([controllerA, controllerB])).toThrow(error);
      expect(controllerB.start).not.toHaveBeenCalled();
    });
  });

  describe('#wait', () => {
    it('resolves immediately when nothing was started', async () => {
      await expectAsync(coordinator.wait()).toBeResolved();
    });

    it('resolves only after all registered controller promises settle', async () => {
      let resolved1 = false;
      let resolved2 = false;

      const controller1 = {
        start: () => new Promise((resolve) => {
          setTimeout(() => {
            resolved1 = true;
            resolve();
          }, 10);
        }),
      };
      const controller2 = {
        start: () => new Promise((resolve) => {
          setTimeout(() => {
            resolved2 = true;
            resolve();
          }, 20);
        }),
      };

      coordinator.startAll([controller1, controller2]);

      await coordinator.wait();

      expect(resolved1).toBeTrue();
      expect(resolved2).toBeTrue();
    });

    it('re-throws a rejection from a registered controller promise', async () => {
      const error = new Error('rejected');
      const controller = { start: () => Promise.reject(error) };

      coordinator.startAll([controller]);

      await expectAsync(coordinator.wait()).toBeRejectedWith(error);
    });
  });
});
