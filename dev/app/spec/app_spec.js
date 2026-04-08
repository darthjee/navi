// Integration tests: exercises the full application stack including the 404 middleware.
import request from 'supertest';
import buildApp from '../app.js';
import { FixturesUtils } from './support/utils/FixturesUtils.js';

const app = buildApp(FixturesUtils.loadYamlFixture('data.yml'));

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
