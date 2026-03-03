/**
 * Config is a class that represents the configuration for the application.
 * It includes the resources that are to be included in the configuration.
 * @author darthjee
 */
class Config {
  /**
   * 
   * @param {object} params - The parameters for creating a Config instance.
   * @param {Array} params.resources - The resources to be included in the configuration.
   */
  constructor({ resources }) {
    this.resources = resources;
  }
}