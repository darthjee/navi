import { Config } from '../models/Config.js';
import { JobRegistry } from '../registry/JobRegistry.js';

class Application {
  loadConfig(configPath) {
    // Load the configuration from the specified path.
    this.config = Config.fromFile(configPath);
    this.jobRegistry = new JobRegistry();
  }

}

export { Application };