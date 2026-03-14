import { WorkersConfig } from '../../lib/models/WorkersConfig.js';

describe('WorkersConfig', () => {
  describe('#constructor', () => {
    describe('when a full config object is provided', () => {
      it('should create an instance with custom values', () => {
        const config = new WorkersConfig({ quantity: 5 });
        expect(config.quantity).toBe(5);
      });
    });

    describe('when a partial config object is provided', () => {
      it('should create an instance with default values for missing properties', () => {
        const config = new WorkersConfig({});
        expect(config.quantity).toBe(1);
      });
    });

    describe('when no config object is provided', () => {
      it('should create an instance with default values', () => {
        const config = new WorkersConfig();
        expect(config.quantity).toBe(1);
      });
    });
  });
});
