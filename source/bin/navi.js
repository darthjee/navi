#!/usr/bin/env node

import { Application } from '../lib/services/Application.js';
import { ArgumentsParser } from '../lib/services/ArgumentsParser.js';

const { configFile } = ArgumentsParser.parse(process.argv.slice(2));
const app = new Application();
app.loadConfig(configFile);
