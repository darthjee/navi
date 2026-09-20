/**
 * Test utility for building the `logContext` spy object used by jobs and clients.
 */
class LogContextUtils {
  /**
   * Builds a logContext spy object exposing `debug`, `info`, `warn` and `error` spies.
   * @returns {jasmine.SpyObj} A spy object standing in for a logContext.
   */
  static build() {
    return jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
  }
}

export { LogContextUtils };
