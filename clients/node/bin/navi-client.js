#!/usr/bin/env node

import { CliArgumentsParser } from '../lib/CliArgumentsParser.js';
import { CliRunner } from '../lib/CliRunner.js';

const options = CliArgumentsParser.parse(process.argv.slice(2));
process.exitCode = await CliRunner.run(options);
