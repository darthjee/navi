import request from 'supertest';
import { AppConfig } from '../../../lib/config/AppConfig.js';
import Serializer from '../../../lib/models/Serializer.js';
import { testData as data } from '../../support/fixtures/testData.js';
import { buildCollectionHandlerApp } from '../../support/utils/AppFactory.js';

describe('CollectionHandler', () => {
  const route = '/categories/:id/items.json';
  const serializer = new Serializer(['id', 'name']);

  beforeEach(() => {
    AppConfig.reset();
  });

  afterEach(() => {
    AppConfig.reset();
  });

  describe('#handle — pagination headers', () => {
    const app = buildCollectionHandlerApp(route, data);

    it('sets the PAGE header', async () => {
      const res = await request(app).get('/categories/1/items.json?page=1&page_size=2');
      expect(res.headers['page']).toBe('1');
    });

    it('sets the PAGE-SIZE header', async () => {
      const res = await request(app).get('/categories/1/items.json?page=1&page_size=2');
      expect(res.headers['page-size']).toBe('2');
    });

    it('sets the PAGES header', async () => {
      const res = await request(app).get('/categories/1/items.json?page=1&page_size=2');
      // fixture has 3 items for category 1, pageSize=2 → ceil(3/2) = 2
      expect(res.headers['pages']).toBe('2');
    });
  });

  describe('#handle — page slicing', () => {
    const app = buildCollectionHandlerApp(route, data, serializer);

    it('returns the correct page of results', async () => {
      const res = await request(app).get('/categories/1/items.json?page=1&page_size=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].id).toBe(1);
    });

    it('returns the second page', async () => {
      const res = await request(app).get('/categories/1/items.json?page=2&page_size=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(3);
    });

    it('returns an empty array for an out-of-range page', async () => {
      const res = await request(app).get('/categories/1/items.json?page=99&page_size=2');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('#handle — parameter defaults', () => {
    describe('when page is omitted', () => {
      it('defaults to page 1', async () => {
        const app = buildCollectionHandlerApp(route, data);
        const res = await request(app).get('/categories/1/items.json?page_size=2');
        expect(res.headers['page']).toBe('1');
        expect(res.body.length).toBe(2);
      });
    });

    describe('when page cannot be parsed', () => {
      it('defaults to page 1', async () => {
        const app = buildCollectionHandlerApp(route, data);
        const res = await request(app).get('/categories/1/items.json?page=abc&page_size=2');
        expect(res.headers['page']).toBe('1');
      });
    });

    describe('when page_size is omitted', () => {
      it('uses AppConfig.json.pageSize', async () => {
        AppConfig.reset();
        const app = buildCollectionHandlerApp(route, data);
        const res = await request(app).get('/categories/1/items.json?page=1');
        expect(res.headers['page-size']).toBe(String(AppConfig.json.pageSize));
      });
    });

    describe('when page_size cannot be parsed', () => {
      it('uses AppConfig.json.pageSize', async () => {
        AppConfig.reset();
        const app = buildCollectionHandlerApp(route, data);
        const res = await request(app).get('/categories/1/items.json?page=1&page_size=bad');
        expect(res.headers['page-size']).toBe(String(AppConfig.json.pageSize));
      });
    });
  });

  describe('#handle — 404 behaviour', () => {
    const app = buildCollectionHandlerApp(route, data);

    it('returns 404 when the category does not exist', async () => {
      const res = await request(app).get('/categories/999/items.json');
      expect(res.status).toBe(404);
    });
  });
});
