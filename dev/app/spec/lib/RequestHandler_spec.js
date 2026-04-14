import express from 'express';
import request from 'supertest';
import RequestHandler from '../../lib/RequestHandler.js';
import Serializer from '../../lib/Serializer.js';
import { BOOKS_CATEGORY, HOBBIT_ITEM } from '../support/fixtures/expectedResponses.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

const data = FixturesUtils.loadYamlFixture('data.yml');

const buildTestApp = (route, routerData, serializer = null, extractorFactory = null) => {
  const app = express();
  const handler = new RequestHandler(route, routerData, serializer, extractorFactory);
  app.get(route, (req, res) => handler.handle(req, res));
  return app;
};

describe('RequestHandler', () => {
  describe('#handle', () => {
    describe('without a serializer', () => {
      const app = buildTestApp('/categories/:id/items/:item_id.json', data);

      it('returns the raw navigation result as JSON', async () => {
        const res = await request(app).get('/categories/1/items/1.json');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(HOBBIT_ITEM);
      });

      it('returns 404 when navigation returns null', async () => {
        const res = await request(app).get('/categories/1/items/999.json');
        expect(res.status).toBe(404);
      });
    });

    describe('when a URL param is non-numeric', () => {
      const app = buildTestApp('/categories/:id.json', data);

      it('returns 400 with an error message', async () => {
        const res = await request(app).get('/categories/abc.json');
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('"id"');
      });
    });

    describe('with a custom extractorFactory', () => {
      const factory = (_route, _params) => ({ steps: () => ['categories', 1] });
      const serializer = new Serializer(['id', 'name']);
      const app = buildTestApp('/any/:x.json', data, serializer, factory);

      it('uses the steps returned by the injected factory', async () => {
        const res = await request(app).get('/any/99.json');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(BOOKS_CATEGORY);
      });
    });

    describe('with a serializer', () => {
      const serializer = new Serializer(['id', 'name']);
      const app = buildTestApp('/categories/:id.json', data, serializer);

      it('returns the projected result', async () => {
        const res = await request(app).get('/categories/1.json');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(BOOKS_CATEGORY);
      });

      it('returns 404 when navigation returns null', async () => {
        const res = await request(app).get('/categories/999.json');
        expect(res.status).toBe(404);
      });
    });
  });
});
