import express from 'express';
import { HandlerConfig } from '../../../lib/common/server/HandlerConfig.js';
import CollectionHandlerExecutor from '../../../lib/handlers/CollectionHandlerExecutor.js';
import ContentHandlerExecutor from '../../../lib/handlers/ContentHandlerExecutor.js';
import { notFound } from '../../../lib/handlers/not_found.js';
import Serializer from '../../../lib/models/Serializer.js';
import Router from '../../../lib/routing/Router.js';
import RouteRegister from '../../../lib/routing/RouteRegister.js';

export const buildCollectionExecutorApp = (route, routerData, serializer = null) => {
  const app = express();
  app.get(route, (req, res) => new CollectionHandlerExecutor(req, res, route, routerData, serializer).handle());
  return app;
};

export const buildContentExecutorApp = (route, routerData, serializer = null, extractorFactory = null) => {
  const app = express();
  app.get(route, (req, res) => new ContentHandlerExecutor(req, res, route, routerData, serializer, extractorFactory).handle());
  return app;
};

export const buildRouteRegisterApp = (routes, routerData) => {
  const app = express();
  const register = new RouteRegister(app);
  routes.forEach(({ route, attributes }) => {
    const serializer = attributes ? new Serializer(attributes) : null;
    register.register(route, new HandlerConfig(ContentHandlerExecutor, [route, routerData, serializer]));
  });
  return app;
};

export const buildRouterApp = (routerData) => {
  const app = express();
  app.use(new Router(routerData).build());
  app.use((_req, res) => notFound(res));
  return app;
};
