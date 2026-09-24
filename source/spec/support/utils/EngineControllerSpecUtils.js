import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { EngineController } from '../../../lib/services/engine/EngineController.js';
import { EngineState } from '../../../lib/services/engine/EngineState.js';

/**
 * Test utility shared by the EngineController spec files.
 */
class EngineControllerSpecUtils {
  /**
   * Installs a beforeEach that builds a running EngineState, the
   * `enqueueResources`/`reloadConfig` spies and an EngineController with a
   * no-op engine, spies on `WorkersRegistry.hasBusyWorker` and
   * `JobRegistry.clearQueues`, and an afterEach that resets the JobRegistry
   * and LogRegistry.
   *
   * The returned context object is refilled on every beforeEach, so specs
   * must read its fields lazily (inside `it`/`beforeEach` blocks).
   * @returns {{controller: EngineController, state: EngineState,
   *   enqueueResources: jasmine.Spy, reloadConfig: jasmine.Spy}} The shared context.
   */
  static setupController() {
    const ctx = {};

    beforeEach(() => {
      ctx.state = new EngineState();
      ctx.state.set('running');

      ctx.enqueueResources = jasmine.createSpy('enqueueResources')
        .and.returnValue({ enqueued: [], skippedResources: [] });
      ctx.reloadConfig = jasmine.createSpy('reloadConfig');

      ctx.controller = new EngineController({
        state: ctx.state,
        sleepMs: 0,
        enqueueResources: ctx.enqueueResources,
        reloadConfig: ctx.reloadConfig,
      });
      ctx.controller.engine = { stop: () => {}, pause: () => {}, resume: () => {}, emit: () => {} };

      spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(false);
      spyOn(JobRegistry, 'clearQueues').and.stub();
    });

    afterEach(() => {
      JobRegistry.reset();
      LogRegistry.reset();
    });

    return ctx;
  }
}

export { EngineControllerSpecUtils };
