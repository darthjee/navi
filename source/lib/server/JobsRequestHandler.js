import { RequestHandler } from './RequestHandler.js';
import { JobRegistry } from '../background/JobRegistry.js';
import { JobSerializer } from '../serializers/JobSerializer.js';

/**
 * Handles GET /jobs/:status.json requests.
 * @author darthjee
 */
class JobsRequestHandler extends RequestHandler {
  /**
   * Creates a new JobsRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Responds with the list of jobs in the given status queue.
   * When a `filters[class][]` query parameter is present, only jobs matching
   * one of the specified class names are returned.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const { status } = req.params;
    const jobClasses = this.#jobClasses(req);
    const jobs = JobRegistry.jobsByStatus(status, { jobClasses });
    res.json(JobSerializer.serialize(jobs, { status, view: 'index' }));
  }

  /**
   * Extracts and normalises the class filter from the request query string.
   * Supports both array (`filters[class][]=Foo&filters[class][]=Bar`) and single-string values.
   * @param {object} req - The Express request object.
   * @returns {string[]} The normalised array of class names (may be empty).
   */
  #jobClasses(req) {
    const value = req.query.filters?.class;
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }
}

export { JobsRequestHandler };
