import { RequestHandler } from '../../../../../../lib/common/server/RequestHandler.js';

/**
 * Fixture handler whose descriptor clashes with the stock `GET /stats.json` route.
 */
class StatsOverrideHandler extends RequestHandler {}

export default [
  { method: 'GET', path: '/stats.json', handler: StatsOverrideHandler },
];
