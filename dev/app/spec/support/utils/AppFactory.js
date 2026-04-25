import express from 'express';
import { notFound } from '../../../lib/not_found.js';
import RequestHandler from '../../../lib/RequestHandler.js';
import Router from '../../../lib/Router.js';
import RouteRegister from '../../../lib/RouteRegister.js';
import Serializer from '../../../lib/Serializer.js';

export const buildRequestHandlerApp = (route, routerData, serializer = null, extractorFactory = null) => {
  const app = express();
  const handler = new RequestHandler(route, routerData, serializer, extractorFactory);
  app.get(route, (req, res) => handler.handle(req, res));
  return app;
};

export const buildRouteRegisterApp = (routes, routerData) => {
  const app = express();
  const register = new RouteRegister(app);
  routes.forEach(({ route, attributes }) => {
    const serializer = attributes ? new Serializer(attributes) : null;
    register.register(route, new RequestHandler(route, routerData, serializer));
  });
  return app;
};

export const buildRouterApp = (routerData) => {
  const app = express();
  app.use(new Router(routerData).build());
  app.use((_req, res) => notFound(res));
  return app;
};
