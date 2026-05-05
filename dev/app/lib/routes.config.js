/**
 * Route definitions for the categories-and-items API.
 * Each entry is passed directly to {@link RouteRegister#register}.
 *
 * @type {Array<{route: string, attributes?: string[], collection?: boolean}>}
 */
export const ROUTES = [
  { route: '/categories.json', attributes: ['id', 'name'], collection: true },
  { route: '/categories/:id.json', attributes: ['id', 'name'] },
  { route: '/categories/:id/items.json', collection: true },
  { route: '/categories/:id/items/:item_id.json' },
];
