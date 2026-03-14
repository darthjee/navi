import { ConfigLoader } from '../services/configLoader.js';

class Application {
  loadConfig(configPath) {
    // Load the configuration from the specified path.
    this.config = ConfigLoader.load(configPath);
  }

}

export { Application };