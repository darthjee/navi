import { Application } from '../../../lib/services/application/Application.js';

/**
 * Test utility that stubs the engine state exposed by Application.
 *
 * Every method installs Jasmine spies, so it must be called from within a spec or a
 * beforeEach block.
 */
class ApplicationStateUtils {
  /**
   * Stubs Application so the engine looks stopped (isStopped true, isRunning false).
   * @returns {void}
   */
  static stubStopped() {
    ApplicationStateUtils.#stub({ stopped: true, running: false });
  }

  /**
   * Stubs Application so the engine looks running (isStopped false, isRunning true).
   * @returns {void}
   */
  static stubRunning() {
    ApplicationStateUtils.#stub({ stopped: false, running: true });
  }

  /**
   * Stubs Application so the engine is neither stopped nor running
   * (isStopped false, isRunning false).
   * @returns {void}
   */
  static stubNeither() {
    ApplicationStateUtils.#stub({ stopped: false, running: false });
  }

  /**
   * Installs the isStopped / isRunning spies with the given return values.
   * @param {{ stopped: boolean, running: boolean }} state - Values returned by the spies.
   * @returns {void}
   */
  static #stub({ stopped, running }) {
    spyOn(Application, 'isStopped').and.returnValue(stopped);
    spyOn(Application, 'isRunning').and.returnValue(running);
  }
}

export { ApplicationStateUtils };
