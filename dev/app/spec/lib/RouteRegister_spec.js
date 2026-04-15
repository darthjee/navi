import express from 'express';
import request from 'supertest';
import RouteRegister from '../../lib/RouteRegister.js';
import { ALL_CATEGORIES, BOOKS_CATEGORY, HOBBIT_ITEM } from '../support/fixtures/expectedResponses.js';
import { testData as data } from '../support/fixtures/testData.js';
import { buildRouteRegisterApp } from '../support/utils/AppFactory.js';

describe('RouteRegister', () => {
  describe('#register', () => {
    describe('when the same route is registered twice', () => {
      it('throws an error identifying the duplicate', () => {
        const register = new RouteRegister(express(), data);
        register.register({ route: '/categories.json' });
        expect(() => register.register({ route: '/categories.json' }))
          .toThrowError('RouteRegister: duplicate route "/categories.json"');
      });
    });

    describe('with /categories/:id/items.json', () => {
      const app = buildRouteRegisterApp([{ route: '/categories/:id/items.json' }], data);

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
      const app = buildRouteRegisterApp([{ route: '/categories/:id/items/:item_id.json' }], data);

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
      const app = buildRouteRegisterApp(
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
      const app = buildRouteRegisterApp(
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

  describe('#routes', () => {
    it('returns the list of registered route patterns in registration order', () => {
      const register = new RouteRegister(express(), data);
      register.register({ route: '/categories.json' });
      register.register({ route: '/categories/:id.json' });
      expect(register.routes()).toEqual(['/categories.json', '/categories/:id.json']);
    });

    it('returns an empty array before any routes are registered', () => {
      const register = new RouteRegister(express(), data);
      expect(register.routes()).toEqual([]);
    });
  });
});
