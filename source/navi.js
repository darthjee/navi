#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { ArgumentsParser } from './lib/services/ArgumentsParser.js';
import { Application } from './lib/services/Application.js';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const { configFile } = ArgumentsParser.parse(process.argv.slice(2));
  const app = new Application();
  app.loadConfig(configFile);
}
