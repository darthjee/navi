import { Logger } from '../../../lib/utils/logging/Logger.js';

/**
 * Test utility for suppressing console and Logger output during specs.
 */
class LoggerUtils {
  /**
   * Stubs all console output methods (debug, info, warn, error).
   * Use in specs that test the Logger itself, where the console must not produce output.
   */
  static stubConsoleMethods() {
    spyOn(console, 'debug').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();
  }

  /**
   * Stubs Logger.info and Logger.error as Jasmine spies.
   * Use in specs that need to suppress logger output and/or assert on log calls.
   */
  static stubLoggerMethods() {
    spyOn(Logger, 'info').and.stub();
    spyOn(Logger, 'error').and.stub();
  }
}

export { LoggerUtils };
