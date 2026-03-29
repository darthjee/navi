import express from 'express';
import router from './lib/router.js';
import { notFound } from './lib/not_found.js';

const app = express();

app.use(router);
app.use((_req, res) => notFound(res));

export default app;
