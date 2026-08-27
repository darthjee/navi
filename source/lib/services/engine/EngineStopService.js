import { ConflictError } from '../../exceptions/http/ConflictError.js';
import { Application } from '../application/Application.js';

/**
 * Shared engine-stop logic used by both `PATCH /engine/stop` and
 * `POST /api/engine/stop`, which are otherwise identical.
 * @author darthjee
 */
class EngineStopService {
  /**
   * Initiates engine stop.
   * @returns {{status: string}} The transitional status response body.
   * @throws {ConflictError} When the engine is not currently running.
   */
  static stop() {
    if (!Application.isRunning()) throw new ConflictError();
    Application.stop();
    return { status: 'stopping' };
  }
}

export { EngineStopService };
