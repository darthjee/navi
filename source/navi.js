#!/usr/bin/env node

import { ArgumentsParser } from './lib/services/ArgumentsParser.js';
import { Application } from './lib/services/Application.js';

const { configFile } = ArgumentsParser.parse(process.argv.slice(2));
const app = new Application();
app.loadConfig(configFile);
