import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { ProcessRssReader } from '../../../utils/memory/ProcessRssReader.js';

/**
 * Executes request-handling behaviour for GET /memory/status.json.
 * @author darthjee
 */
class MemoryStatusHandler extends RequestHandler {
  #response;
  #memoryConfig;
  #rssReader;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {MemoryConfig} memoryConfig - The resolved `web.memory` configuration.
   * @param {ProcessRssReader} [rssReader] - Reader used to obtain the current process RSS.
   */
  constructor(_request, response, memoryConfig, rssReader = new ProcessRssReader()) {
    super();
    this.#response = response;
    this.#memoryConfig = memoryConfig;
    this.#rssReader = rssReader;
  }

  /**
   * Responds with the current process memory usage against the resolved maximum.
   * @returns {void}
   */
  handle() {
    const current = this.#rssReader.read();
    const maximum = this.#memoryConfig.maximum;
    const percentage = (current / maximum) * 100;
    const status = this.#memoryConfig.statusFor(percentage);

    this.#response.json({ current, maximum, percentage, status });
  }
}

export { MemoryStatusHandler };
