import express from 'express';
import { notFound } from './lib/not_found.js';
import router from './lib/router.js';

const app = express();

app.use(router);
app.use((_req, res) => notFound(res));

export default app;
