import express from 'express';
import { notFound } from './lib/not_found.js';
import Router from './lib/router.js';

const buildApp = (data) => {
  const app = express();
  app.use(new Router(data).build());
  app.use((_req, res) => notFound(res));
  return app;
};

export default buildApp;
