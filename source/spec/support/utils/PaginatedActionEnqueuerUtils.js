import { JobRegistry } from '../../../lib/background/JobRegistry.js';

/**
 * Test utility for setting up the shared PaginatedActionEnqueuer/PaginatedActionsEnqueuer spec context.
 */
class PaginatedActionEnqueuerUtils {
  /**
   * Installs a beforeEach that creates a paginatedAction spy and builds the JobRegistry,
   * and an afterEach that resets it.
   * Returns a context object whose `paginatedAction` property is populated before each spec.
   * @returns {{ paginatedAction: jasmine.SpyObj }} Context object populated before each spec.
   */
  static setup() {
    const ctx = {};

    beforeEach(() => {
      ctx.paginatedAction = jasmine.createSpyObj('paginatedAction', ['execute']);
      JobRegistry.build({ cooldown: -1 });
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      JobRegistry.reset();
    });

    return ctx;
  }
}

export { PaginatedActionEnqueuerUtils };
