import express from 'express';
import { notFound } from './lib/not_found.js';
import Router from './lib/Router.js';

/**
 * Builds and returns a configured Express application.
 * Registers all API routes via {@link Router} and attaches a catch-all 404 handler.
 * @param {Object} data - Parsed YAML data to serve.
 * @returns {import('express').Application}
 */
const buildApp = (data) => {
  const app = express();
  app.use(new Router(data).build());
  app.use((_req, res) => notFound(res));
  return app;
};

export default buildApp;
