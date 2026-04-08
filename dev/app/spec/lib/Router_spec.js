// Unit tests: exercises the Router class in isolation inside a minimal Express wrapper.
import express from 'express';
import request from 'supertest';
import { notFound } from '../../lib/not_found.js';
import Router from '../../lib/Router.js';
import { ALL_CATEGORIES, BOOKS_CATEGORY, HOBBIT_ITEM } from '../support/fixtures/expectedResponses.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

const data = FixturesUtils.loadYamlFixture('data.yml');

const buildTestApp = (routerData) => {
  const app = express();
  app.use(new Router(routerData).build());
  app.use((_req, res) => notFound(res));
  return app;
};

describe('Router', () => {
  const app = buildTestApp(data);

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
