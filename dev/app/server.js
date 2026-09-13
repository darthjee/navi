import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import buildApp from './app.js';
import { AppConfig } from './lib/config/AppConfig.js';

const dataPath = process.argv[2] || './data.yml';
const configPath = process.argv[3] || './config.yml';

AppConfig.load(configPath);
// `dataPath` comes from process.argv[2] (default './data.yml'), a CLI
// argument supplied only by whoever launches this dev server process at
// startup — never derived from an HTTP request handled by the app.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const data = load(readFileSync(dataPath, 'utf8'));
const rawRate = parseFloat(process.env.DEV_APP_FAILURE_RATE);
const failureRate = Number.isNaN(rawRate) ? 0 : rawRate;
const app = buildApp(data, failureRate);

app.listen(8080);
