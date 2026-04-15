import { ROUTES } from '../../lib/routes.config.js';

describe('ROUTES', () => {
  it('contains exactly four route definitions', () => {
    expect(ROUTES.length).toBe(4);
  });

  it('defines the categories list route with id and name attributes', () => {
    const entry = ROUTES.find(r => r.route === '/categories.json');
    expect(entry).toEqual({ route: '/categories.json', attributes: ['id', 'name'] });
  });

  it('defines the single category route with id and name attributes', () => {
    const entry = ROUTES.find(r => r.route === '/categories/:id.json');
    expect(entry).toEqual({ route: '/categories/:id.json', attributes: ['id', 'name'] });
  });

  it('defines the category items list route without attributes', () => {
    const entry = ROUTES.find(r => r.route === '/categories/:id/items.json');
    expect(entry).toEqual({ route: '/categories/:id/items.json' });
  });

  it('defines the single item route without attributes', () => {
    const entry = ROUTES.find(r => r.route === '/categories/:id/items/:item_id.json');
    expect(entry).toEqual({ route: '/categories/:id/items/:item_id.json' });
  });
});
