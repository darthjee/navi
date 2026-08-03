import { EngineStopService } from '../../../services/EngineStopService.js';
import { SecuredRequestHandler } from '../../SecuredRequestHandler.js';

/**
 * Executes request-handling behaviour for POST /api/engine/stop.
 * Identical to `PATCH /engine/stop` (no body), reusing the same shared logic.
 * @author darthjee
 */
class ApiEngineStopHandler extends SecuredRequestHandler {
  /**
   * Initiates engine stop. Responds immediately with the transitional status.
   * @returns {void}
   * @throws {ConflictError} When the engine is not currently running.
   */
  process() {
    this.response.json(EngineStopService.stop());
  }
}

export { ApiEngineStopHandler };
