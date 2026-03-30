import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import buildApp from './app.js';

const dataPath = process.argv[2] || './data.yml';
const data = load(readFileSync(dataPath, 'utf8'));
const app = buildApp(data);

app.listen(80);
