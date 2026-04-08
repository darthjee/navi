import express from 'express';
import request from 'supertest';
import RouteRegister from '../../lib/RouteRegister.js';
import { ALL_CATEGORIES, BOOKS_CATEGORY, HOBBIT_ITEM } from '../support/fixtures/expectedResponses.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

const data = FixturesUtils.loadYamlFixture('data.yml');

const buildTestApp = (routes, routerData) => {
  const app = express();
  const register = new RouteRegister(app, routerData);
  routes.forEach((opts) => register.register(opts));
  return app;
};

describe('RouteRegister', () => {
  describe('#register', () => {
    describe('with /categories/:id/items.json', () => {
      const app = buildTestApp([{ route: '/categories/:id/items.json' }], data);

      it('returns items for a valid category', async () => {
        const res = await request(app).get('/categories/1/items.json');
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
      });

      it('returns 404 for an unknown category', async () => {
        const res = await request(app).get('/categories/999/items.json');
        expect(res.status).toBe(404);
      });
    });

    describe('with /categories/:id/items/:item_id.json', () => {
      const app = buildTestApp([{ route: '/categories/:id/items/:item_id.json' }], data);

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

    describe('with attributes projection', () => {
      const app = buildTestApp(
        [{ route: '/categories.json', attributes: ['id', 'name'] }],
        data
      );

      it('returns only the specified attributes for each element', async () => {
        const res = await request(app).get('/categories.json');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(ALL_CATEGORIES);
      });
    });

    describe('with attributes projection on a single resource', () => {
      const app = buildTestApp(
        [{ route: '/categories/:id.json', attributes: ['id', 'name'] }],
        data
      );

      it('returns only the specified attributes', async () => {
        const res = await request(app).get('/categories/1.json');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(BOOKS_CATEGORY);
      });

      it('returns 404 for an unknown id', async () => {
        const res = await request(app).get('/categories/999.json');
        expect(res.status).toBe(404);
      });
    });
  });
});
