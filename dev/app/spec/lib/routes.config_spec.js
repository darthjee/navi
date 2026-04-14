import { ROUTES } from '../../lib/routes.config.js';

describe('ROUTES', () => {
  it('contains exactly four route definitions', () => {
    expect(ROUTES.length).toBe(4);
  });

  it('defines the categories list route with id and name attributes', () => {
    expect(ROUTES[0]).toEqual({ route: '/categories.json', attributes: ['id', 'name'] });
  });

  it('defines the single category route with id and name attributes', () => {
    expect(ROUTES[1]).toEqual({ route: '/categories/:id.json', attributes: ['id', 'name'] });
  });

  it('defines the category items list route without attributes', () => {
    expect(ROUTES[2]).toEqual({ route: '/categories/:id/items.json' });
  });

  it('defines the single item route without attributes', () => {
    expect(ROUTES[3]).toEqual({ route: '/categories/:id/items/:item_id.json' });
  });
});
