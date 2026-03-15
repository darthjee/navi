#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { Application } from './lib/services/Application.js';

const DEFAULT_CONFIG_PATH = 'config/navi_config.yml';

/**
 * Parses command line arguments to extract the config file path.
 *
 * Supports:
 *   -c <path>        Short form with a space-separated value
 *   --config=<path>  Long form with an equals sign
 *
 * Falls back to DEFAULT_CONFIG_PATH when no option is provided.
 *
 * @param {string[]} args - Command line arguments (typically process.argv.slice(2))
 * @returns {string} The resolved config file path
 */
function parseConfigPath(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-c') {
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        console.error('Error: -c option requires a config file path');
        process.exit(1);
      }
      return args[i + 1];
    }

    if (args[i].startsWith('--config=')) {
      const value = args[i].slice('--config='.length);
      if (!value) {
        console.error('Error: --config option requires a config file path');
        process.exit(1);
      }
      return value;
    }
  }

  return DEFAULT_CONFIG_PATH;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const configPath = parseConfigPath(process.argv.slice(2));
  const app = new Application();
  app.loadConfig(configPath);
}

export { DEFAULT_CONFIG_PATH, parseConfigPath };
