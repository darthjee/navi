#!/usr/bin/env node

import { Application } from '../lib/services/application/Application.js';
import { ArgumentsParser } from '../lib/services/application/ArgumentsParser.js';

const { config, menu } = ArgumentsParser.parse(process.argv.slice(2));
Application.build();
Application.loadConfig(config, menu);
Application.run();
