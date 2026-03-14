import { Config } from '../models/Config.js';

class Application {
  loadConfig(configPath) {
    // Load the configuration from the specified path.
    this.config = Config.fromFile(configPath);
  }

}

export { Application };