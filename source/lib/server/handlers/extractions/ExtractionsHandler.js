import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { ExtractionRegistry } from '../../../registry/ExtractionRegistry.js';
import { ExtractionSerializer } from '../../../serializers/ExtractionSerializer.js';

/**
 * Executes request-handling behaviour for GET /extractions.json.
 * Returns the extraction counters alongside a paginated, `last_id`-cursored list of
 * serialized extraction records.
 * @author darthjee
 */
class ExtractionsHandler extends RequestHandler {
  #request;
  #response;
  #pageSize;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {number} pageSize - Maximum number of extraction records to return.
   */
  constructor(request, response, pageSize) {
    super();
    this.#request = request;
    this.#response = response;
    this.#pageSize = pageSize;
  }

  /**
   * Responds with `{ counts, extractions }` for the extraction-tracking store.
   * @returns {void}
   */
  handle() {
    const { last_id: lastId } = this.#request.query;
    const records = ExtractionRegistry.getRecords({ lastId });

    this.#response.json({
      counts: ExtractionRegistry.counts,
      extractions: ExtractionSerializer.serialize(records.slice(0, this.#pageSize)),
    });
  }
}

export { ExtractionsHandler };
