import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import buildApp from './app.js';

const dataPath = process.argv[2] || './data.yml';
const data = load(readFileSync(dataPath, 'utf8'));
const rawRate = parseFloat(process.env.DEV_APP_FAILURE_RATE);
const failureRate = Number.isNaN(rawRate) ? 0 : rawRate;
const app = buildApp(data, failureRate);

app.listen(8080);
