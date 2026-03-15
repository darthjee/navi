import { Config } from '../models/Config.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';

class Application {
  loadConfig(configPath) {
    // Load the configuration from the specified path.
    this.config = Config.fromFile(configPath);
    this.jobRegistry = new JobRegistry();
    this.workersRegistry = new WorkersRegistry({
      jobRegistry: this.jobRegistry, ...this.config.workerConfig
    });
  }
}

export { Application };