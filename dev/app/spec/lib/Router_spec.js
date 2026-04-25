// Unit tests: exercises the Router class in isolation inside a minimal Express wrapper.
import request from 'supertest';
import { ALL_CATEGORIES, BOOKS_CATEGORY, HOBBIT_ITEM } from '../support/fixtures/expectedResponses.js';
import { testData as data } from '../support/fixtures/testData.js';
import { buildRouterApp } from '../support/utils/AppFactory.js';

describe('Router', () => {
  const app = buildRouterApp(data);

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

    it('redirects to /#/categories/:id', async () => {
      const res = await request(app).get('/categories/1').redirects(0);
      expect(res.headers['location']).toBe('/#/categories/1');
    });
  });

  describe('GET /categories/:id/items (redirect)', () => {
    it('responds with 302', async () => {
      const res = await request(app).get('/categories/1/items').redirects(0);
      expect(res.status).toBe(302);
    });

    it('redirects to /#/categories/:id/items', async () => {
      const res = await request(app).get('/categories/1/items').redirects(0);
      expect(res.headers['location']).toBe('/#/categories/1/items');
    });
  });

  describe('GET /categories/:categoryId/items/:id (redirect)', () => {
    it('responds with 302', async () => {
      const res = await request(app).get('/categories/1/items/2').redirects(0);
      expect(res.status).toBe(302);
    });

    it('redirects to /#/categories/:categoryId/items/:id', async () => {
      const res = await request(app).get('/categories/1/items/2').redirects(0);
      expect(res.headers['location']).toBe('/#/categories/1/items/2');
    });
  });

  describe('GET /categories.json', () => {
    it('returns all categories without items', async () => {
      const res = await request(app).get('/categories.json');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(ALL_CATEGORIES);
    });
  });

  describe('GET /categories/:id.json', () => {
    it('returns the matching category', async () => {
      const res = await request(app).get('/categories/1.json');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(BOOKS_CATEGORY);
    });

    it('returns 404 for an unknown id', async () => {
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

    it('returns 404 for an unknown category', async () => {
      const res = await request(app).get('/categories/999/items.json');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /categories/:id/items/:item_id.json', () => {
    it('returns the matching item', async () => {
      const res = await request(app).get('/categories/1/items/1.json');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(HOBBIT_ITEM);
    });

    it('returns 404 for an unknown item', async () => {
      const res = await request(app).get('/categories/1/items/999.json');
      expect(res.status).toBe(404);
    });
  });
});
