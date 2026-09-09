import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler that acknowledges a reindex request.
 */
class ReindexHandler extends RequestHandler {
  /**
   * @param {object} _req - The Express request.
   * @param {object} res - The Express response.
   */
  constructor(_req, res) {
    super();
    this.res = res;
  }

  /**
   * @returns {Promise<void>} Resolves once the response is sent.
   */
  async handle() {
    this.res.json({ reindexed: true });
  }
}

export default [
  { method: 'POST', path: '/ext/reindex', handler: ReindexHandler },
];
