import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler that reports a static health payload.
 */
class HealthHandler extends RequestHandler {
  /**
   * @param {object} _req - The Express request.
   * @param {object} res - The Express response.
   */
  constructor(_req, res) {
    super();
    this.res = res;
  }

  /**
   * @returns {void}
   */
  handle() {
    this.res.json({ status: 'ok' });
  }
}

export default [
  { method: 'GET', path: '/ext/health', handler: HealthHandler },
];
