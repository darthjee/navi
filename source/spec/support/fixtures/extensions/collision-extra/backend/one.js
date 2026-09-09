import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler that wins the extra-vs-extra collision for `POST /ext/dup`.
 */
class DupOneHandler extends RequestHandler {}

export default [
  { method: 'POST', path: '/ext/dup', handler: DupOneHandler },
];
