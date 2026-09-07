/**
 * Route definitions for the demo collector (emit target) endpoint.
 * Each entry is passed to {@link RouteRegister#register} with its method.
 *
 * @type {Array<{route: string, method: string}>}
 */
export const COLLECTOR_ROUTES = [
  { route: '/collector/:source', method: 'post' },
];
