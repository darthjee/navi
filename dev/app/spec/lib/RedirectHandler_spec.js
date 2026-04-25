import express from 'express';
import request from 'supertest';
import RedirectHandler from '../../lib/RedirectHandler.js';

const buildApp = (route, target) => {
  const app = express();
  const handler = new RedirectHandler(target);
  app.get(route, (req, res) => handler.handle(req, res));
  return app;
};

describe('RedirectHandler', () => {
  describe('#handle — static route with no params', () => {
    const app = buildApp('/categories', '/#/categories');

    it('responds with 302', async () => {
      const res = await request(app).get('/categories').redirects(0);
      expect(res.status).toBe(302);
    });

    it('sets Location to the hash-based target', async () => {
      const res = await request(app).get('/categories').redirects(0);
      expect(res.headers['location']).toBe('/#/categories');
    });
  });

  describe('#handle — route with one param', () => {
    const app = buildApp('/categories/:id', '/#/categories/:id');

    it('responds with 302', async () => {
      const res = await request(app).get('/categories/5').redirects(0);
      expect(res.status).toBe(302);
    });

    it('substitutes the param into the Location header', async () => {
      const res = await request(app).get('/categories/5').redirects(0);
      expect(res.headers['location']).toBe('/#/categories/5');
    });
  });

  describe('#handle — route with two params', () => {
    const app = buildApp(
      '/categories/:categoryId/items/:id',
      '/#/categories/:categoryId/items/:id'
    );

    it('responds with 302', async () => {
      const res = await request(app).get('/categories/3/items/7').redirects(0);
      expect(res.status).toBe(302);
    });

    it('substitutes both params into the Location header', async () => {
      const res = await request(app).get('/categories/3/items/7').redirects(0);
      expect(res.headers['location']).toBe('/#/categories/3/items/7');
    });
  });
});
