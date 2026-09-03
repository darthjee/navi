import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { MemoryRegistry } from '../../../registry/MemoryRegistry.js';
import { MemoryDataSerializer } from '../../../serializers/MemoryDataSerializer.js';

/**
 * Executes request-handling behaviour for GET /memory/history.json.
 * Returns a paginated, `last_id`-cursored list of serialized memory readings.
 * @author darthjee
 */
class MemoryHistoryHandler extends RequestHandler {
  #request;
  #response;
  #pageSize;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {number} pageSize - Maximum number of memory entries to return.
   */
  constructor(request, response, pageSize) {
    super();
    this.#request = request;
    this.#response = response;
    this.#pageSize = pageSize;
  }

  /**
   * Responds with a paginated JSON array of memory entries.
   * @returns {void}
   */
  handle() {
    const { last_id: lastId } = this.#request.query;
    const entries = MemoryRegistry.getEntries({ lastId });

    this.#response.json(MemoryDataSerializer.serialize(entries.slice(0, this.#pageSize)));
  }
}

export { MemoryHistoryHandler };
