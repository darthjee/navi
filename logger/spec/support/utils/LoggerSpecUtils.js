/**
 * Test utility for suppressing console output during specs.
 */
class LoggerSpecUtils {
  /**
   * Stubs all console output methods (debug, info, warn, error).
   * Use in specs that test the Logger itself, where the console must not produce output.
   * @returns {void}
   */
  static stubConsoleMethods() {
    spyOn(console, 'debug').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();
  }
}

export { LoggerSpecUtils };
