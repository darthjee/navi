import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler that survives alongside a broken sibling module.
 */
class SurvivorHandler extends RequestHandler {
  /**
   * @param {object} _req - The Express request.
   * @param {object} res - The Express response.
   * @returns {void}
   */
  handle(_req, res) {
    res.json({ ok: true });
  }
}

export default [
  { method: 'GET', path: '/ext/survivor', handler: SurvivorHandler },
];
