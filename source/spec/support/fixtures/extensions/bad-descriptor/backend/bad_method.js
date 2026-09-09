import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler attached to a descriptor with an unsupported method.
 */
class DeleteHandler extends RequestHandler {}

export default [
  { method: 'DELETE', path: '/x', handler: DeleteHandler },
];
