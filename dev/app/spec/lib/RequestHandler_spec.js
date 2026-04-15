import request from 'supertest';
import Serializer from '../../lib/Serializer.js';
import { BOOKS_CATEGORY, HOBBIT_ITEM } from '../support/fixtures/expectedResponses.js';
import { buildRequestHandlerApp } from '../support/utils/AppFactory.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

const data = FixturesUtils.loadYamlFixture('data.yml');

describe('RequestHandler', () => {
  describe('#handle', () => {
    describe('without a serializer', () => {
      const app = buildRequestHandlerApp('/categories/:id/items/:item_id.json', data);

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
      const app = buildRequestHandlerApp('/categories/:id.json', data);

      beforeEach(() => {
        spyOn(console, 'warn');
      });

      it('returns 400 with an error message', async () => {
        const res = await request(app).get('/categories/abc.json');
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('"id"');
      });

      it('logs the route and URL to console.warn', async () => {
        await request(app).get('/categories/abc.json');
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('/categories/:id.json')
        );
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('/categories/abc.json')
        );
      });
    });

    describe('with a custom extractorFactory', () => {
      const factory = (_route, _params) => ({ steps: () => ['categories', 1] });
      const serializer = new Serializer(['id', 'name']);
      const app = buildRequestHandlerApp('/any/:x.json', data, serializer, factory);

      it('uses the steps returned by the injected factory', async () => {
        const res = await request(app).get('/any/99.json');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(BOOKS_CATEGORY);
      });
    });

    describe('with a serializer', () => {
      const serializer = new Serializer(['id', 'name']);
      const app = buildRequestHandlerApp('/categories/:id.json', data, serializer);

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
