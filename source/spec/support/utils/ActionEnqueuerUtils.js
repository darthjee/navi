import { JobRegistry } from '../../../lib/registry/JobRegistry.js';

/**
 * Test utility for setting up the shared ActionEnqueuer/ActionsEnqueuer spec context.
 */
class ActionEnqueuerUtils {
  /**
   * Installs a beforeEach that creates an action spy and builds the JobRegistry,
   * and an afterEach that resets it.
   * Returns a context object whose `action` property is populated before each spec.
   * @returns {{ action: jasmine.SpyObj }}
   */
  static setup() {
    const ctx = {};

    beforeEach(() => {
      ctx.action = jasmine.createSpyObj('action', ['execute']);
      JobRegistry.build({ cooldown: -1 });
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      JobRegistry.reset();
    });

    return ctx;
  }
}

export { ActionEnqueuerUtils };
