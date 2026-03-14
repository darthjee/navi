import { ConfigLoader } from '../services/ConfigLoader.js';

class Application {
  loadConfig(configPath) {
    // Load the configuration from the specified path.
    this.config = ConfigLoader.load(configPath);
  }

}

export { Application };