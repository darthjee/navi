/**
 * Redirect route definitions — maps plain path routes to their hash-based
 * frontend equivalents. Each entry is passed to {@link RedirectRegister#register}.
 *
 * @type {Array<{route: string, target: string}>}
 */
export const REDIRECT_ROUTES = [
  { route: '/categories', target: '/#/categories' },
  { route: '/categories/:id', target: '/#/categories/:id' },
  { route: '/categories/:id/items', target: '/#/categories/:id/items' },
  { route: '/categories/:categoryId/items/:id', target: '/#/categories/:categoryId/items/:id' },
];
