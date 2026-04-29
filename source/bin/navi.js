#!/usr/bin/env node

import { Application } from '../lib/services/Application.js';
import { ArgumentsParser } from '../lib/services/ArgumentsParser.js';

const { config } = ArgumentsParser.parse(process.argv.slice(2));
Application.build();
Application.loadConfig(config);
Application.run();
