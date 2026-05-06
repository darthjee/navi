import express from 'express';
import morgan from 'morgan';
import { notFound } from './lib/handlers/not_found.js';
import FailureSimulator from './lib/models/FailureSimulator.js';
import Router from './lib/routing/Router.js';

/**
 * Builds and returns a configured Express application.
 * Registers all API routes via {@link Router} and attaches a catch-all 404 handler.
 * @param {Object} data - Parsed YAML data to serve.
 * @param {number} [failureRate=0] - Probability (0–1) that any request will be failed with 502.
 * @returns {import('express').Application}
 */
const buildApp = (data, failureRate = 0) => {
  const app = express();
  const simulator = new FailureSimulator(failureRate);
  app.use(morgan('combined'));
  app.use((req, res, next) => simulator.handle(req, res, next));
  app.use(new Router(data).build());
  app.use((_req, res) => notFound(res));
  return app;
};

export default buildApp;
