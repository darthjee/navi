// Integration tests: exercises the full application stack including the 404 middleware.
import request from 'supertest';
import buildApp from '../app.js';
import { FixturesUtils } from './support/utils/FixturesUtils.js';

const app = buildApp(FixturesUtils.loadYamlFixture('data.yml'));

describe('GET /categories (redirect)', () => {
  it('responds with 302', async () => {
    const res = await request(app).get('/categories').redirects(0);
    expect(res.status).toBe(302);
  });

  it('redirects to /#/categories', async () => {
    const res = await request(app).get('/categories').redirects(0);
    expect(res.headers['location']).toBe('/#/categories');
  });
});

describe('GET /categories/:id (redirect)', () => {
  it('responds with 302', async () => {
    const res = await request(app).get('/categories/1').redirects(0);
    expect(res.status).toBe(302);
  });

  it('redirects to /#/categories/1', async () => {
    const res = await request(app).get('/categories/1').redirects(0);
    expect(res.headers['location']).toBe('/#/categories/1');
  });
});

describe('GET /categories/:id/items (redirect)', () => {
  it('responds with 302', async () => {
    const res = await request(app).get('/categories/1/items').redirects(0);
    expect(res.status).toBe(302);
  });

  it('redirects to /#/categories/1/items', async () => {
    const res = await request(app).get('/categories/1/items').redirects(0);
    expect(res.headers['location']).toBe('/#/categories/1/items');
  });
});

describe('GET /categories/:categoryId/items/:id (redirect)', () => {
  it('responds with 302', async () => {
    const res = await request(app).get('/categories/1/items/2').redirects(0);
    expect(res.status).toBe(302);
  });

  it('redirects to /#/categories/1/items/2', async () => {
    const res = await request(app).get('/categories/1/items/2').redirects(0);
    expect(res.headers['location']).toBe('/#/categories/1/items/2');
  });
});

describe('GET /categories.json', () => {
  it('returns all categories without items', async () => {
    const res = await request(app).get('/categories.json');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].items).toBeUndefined();
  });
});

describe('GET /categories/:id.json', () => {
  it('returns the category', async () => {
    const res = await request(app).get('/categories/1.json');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/categories/999.json');
    expect(res.status).toBe(404);
  });
});

describe('GET /categories/:id/items.json', () => {
  it('returns items for the category', async () => {
    const res = await request(app).get('/categories/1/items.json');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 404 for unknown category', async () => {
    const res = await request(app).get('/categories/999/items.json');
    expect(res.status).toBe(404);
  });
});

describe('GET /categories/:id/items/:item_id.json', () => {
  it('returns the item', async () => {
    const res = await request(app).get('/categories/1/items/1.json');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for unknown item', async () => {
    const res = await request(app).get('/categories/1/items/999.json');
    expect(res.status).toBe(404);
  });
});

describe('unmatched routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});

describe('with failureRate = 1', () => {
  const failingApp = buildApp(FixturesUtils.loadYamlFixture('data.yml'), 1);

  it('returns 502 for a JSON route', async () => {
    const res = await request(failingApp).get('/categories.json');
    expect(res.status).toBe(502);
  });

  it('returns 502 for a redirect route', async () => {
    const res = await request(failingApp).get('/categories').redirects(0);
    expect(res.status).toBe(502);
  });

  it('returns 502 for an unknown route', async () => {
    const res = await request(failingApp).get('/unknown');
    expect(res.status).toBe(502);
  });
});
