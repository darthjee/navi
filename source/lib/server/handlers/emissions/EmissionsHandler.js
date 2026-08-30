import { RequestHandler } from '../../../common/server/RequestHandler.js';
import { EmissionRegistry } from '../../../registry/EmissionRegistry.js';
import { EmissionSerializer } from '../../../serializers/EmissionSerializer.js';

/**
 * Executes request-handling behaviour for GET /emissions.json.
 * Returns the emission counters alongside a paginated, `last_id`-cursored list of
 * serialized emission records.
 * @author darthjee
 */
class EmissionsHandler extends RequestHandler {
  #request;
  #response;
  #pageSize;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {number} pageSize - Maximum number of emission records to return.
   */
  constructor(request, response, pageSize) {
    super();
    this.#request = request;
    this.#response = response;
    this.#pageSize = pageSize;
  }

  /**
   * Responds with `{ counts, emissions }` for the emission-tracking store.
   * @returns {void}
   */
  handle() {
    const { last_id: lastId } = this.#request.query;
    const records = EmissionRegistry.getRecords({ lastId });

    this.#response.json({
      counts: EmissionRegistry.counts,
      emissions: EmissionSerializer.serialize(records.slice(0, this.#pageSize)),
    });
  }
}

export { EmissionsHandler };
