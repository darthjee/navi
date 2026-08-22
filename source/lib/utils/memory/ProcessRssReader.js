/**
 * Wraps `process.memoryUsage().rss`, so consumers reading the current process
 * resident set size never reach for `process` directly.
 * @author darthjee
 */
class ProcessRssReader {
  /**
   * @returns {number} The current process resident set size, in bytes.
   */
  read() {
    return process.memoryUsage().rss;
  }
}

export { ProcessRssReader };
