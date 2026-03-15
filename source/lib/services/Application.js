import { Config } from '../models/Config.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkerRegistry } from '../registry/WorkerRegistry.js';

class Application {
  loadConfig(configPath) {
    // Load the configuration from the specified path.
    this.config = Config.fromFile(configPath);
    this.jobRegistry = new JobRegistry();
    this.workersRegistry = new WorkerRegistry({
      jobRegistry: this.jobRegistry, quantity: this.config.getWorkersQuantity()
    });
  }
}

export { Application };