class WorkersConfig {
  constructor(config) {
    this.quantity = config ? config.quantity || 1 : 1;
  }
}

export { WorkersConfig };