import express from 'express';
import request from 'supertest';
import RouteRegistrar from '../../lib/route_registrar.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

const data = FixturesUtils.loadYamlFixture('data.yml');

const buildTestApp = (routes, routerData) => {
  const app = express();
  const registrar = new RouteRegistrar(app, routerData);
  routes.forEach((route) => registrar.register(route));
  return app;
};

describe('RouteRegistrar', () => {
  describe('#register', () => {
    describe('with /categories/:id/items.json', () => {
      const app = buildTestApp(['/categories/:id/items.json'], data);

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
      const app = buildTestApp(['/categories/:id/items/:item_id.json'], data);

      it('returns the matching item', async () => {
        const res = await request(app).get('/categories/1/items/1.json');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: 1, name: 'The Hobbit' });
      });

      it('returns 404 for an unknown item', async () => {
        const res = await request(app).get('/categories/1/items/999.json');
        expect(res.status).toBe(404);
      });
    });
  });
});
