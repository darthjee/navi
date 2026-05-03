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
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  handle(_req, res, next) {
    if (Math.random() < this.#failureRate) {
      res.status(502).json({ error: 'Simulated failure' });
    } else {
      next();
    }
  }
}

export default FailureSimulator;
