import { ConfigLoader } from './ConfigLoader.js';

class Application {
  loadConfig(configPath) {
    // Load the configuration from the specified path.
    this.config = ConfigLoader.fromFile(configPath);
  }

}

export { Application };