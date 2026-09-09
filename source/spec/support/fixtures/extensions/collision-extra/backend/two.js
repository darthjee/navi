import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler that loses the extra-vs-extra collision for `POST /ext/dup`.
 */
class DupTwoHandler extends RequestHandler {}

export default [
  { method: 'POST', path: '/ext/dup', handler: DupTwoHandler },
];
