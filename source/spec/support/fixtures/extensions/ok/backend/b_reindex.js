import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler that acknowledges a reindex request.
 */
class ReindexHandler extends RequestHandler {
  /**
   * @param {object} _req - The Express request.
   * @param {object} res - The Express response.
   * @returns {Promise<void>} Resolves once the response is sent.
   */
  async handle(_req, res) {
    res.json({ reindexed: true });
  }
}

export default [
  { method: 'POST', path: '/ext/reindex', handler: ReindexHandler },
];
