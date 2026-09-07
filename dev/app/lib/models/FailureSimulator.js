const STATIC_ROOT = '/';
const STATIC_ASSETS_PREFIX = '/assets/';
const COLLECTOR_PREFIX = '/collector/';

/**
 * Express middleware that randomly fails HTTP requests at a configurable rate.
 */
class FailureSimulator {
  #failureRate;

  /**
   * @param {number} [failureRate=0] - Probability (0–1) that a request will be failed with 502.
   */
  constructor(failureRate = 0) {
    this.#failureRate = failureRate;
  }

  /**
   * Express middleware. Responds with 502 at the configured failure rate; otherwise calls next().
   * Requests to `/`, `/assets/*` and `/collector/*` are always passed through without failure injection.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  handle(req, res, next) {
    if (this.#isExemptPath(req.path)) {
      return next();
    }

    if (Math.random() < this.#failureRate) {
      res.status(502).json({ error: 'Simulated failure' });
    } else {
      next();
    }
  }

  /**
   * Returns true if the given path is exempt from failure injection
   * (the static root, static assets, or the collector endpoint).
   * @param {string} path
   * @returns {boolean}
   */
  #isExemptPath(path) {
    return path === STATIC_ROOT
      || path.startsWith(STATIC_ASSETS_PREFIX)
      || path.startsWith(COLLECTOR_PREFIX);
  }
}

export default FailureSimulator;
