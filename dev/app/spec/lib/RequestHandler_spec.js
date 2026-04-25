import express from 'express';
import request from 'supertest';
import RequestHandler from '../../lib/RequestHandler.js';

describe('RequestHandler', () => {
  describe('#handle — base class contract', () => {
    it('throws when called directly without being overridden', () => {
      const handler = new RequestHandler();
      expect(() => handler.handle({}, {}))
        .toThrowError('RequestHandler#handle must be implemented by subclass');
    });

    it('is an instance of RequestHandler when subclassed', () => {
      class MyHandler extends RequestHandler {
        handle(_req, res) { res.status(200).json({ ok: true }); }
      }
      expect(new MyHandler()).toBeInstanceOf(RequestHandler);
    });

    it('delegates to the subclass handle implementation via Express', async () => {
      class MyHandler extends RequestHandler {
        handle(_req, res) { res.status(200).json({ ok: true }); }
      }
      const app = express();
      const handler = new MyHandler();
      app.get('/test', (req, res) => handler.handle(req, res));
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });
});
