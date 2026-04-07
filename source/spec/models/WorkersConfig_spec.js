import { WorkersConfig } from '../../lib/models/WorkersConfig.js';

describe('WorkersConfig', () => {
  describe('#constructor', () => {
    describe('when a full config object is provided', () => {
      it('should create an instance with custom quantity', () => {
        const config = new WorkersConfig({ quantity: 5 });
        expect(config.quantity).toBe(5);
      });

      it('should create an instance with custom retry_cooldown', () => {
        const config = new WorkersConfig({ quantity: 5, retry_cooldown: 3000 });
        expect(config.retryCooldown).toBe(3000);
      });
    });

    describe('when a partial config object is provided', () => {
      it('should create an instance with default quantity', () => {
        const config = new WorkersConfig({});
        expect(config.quantity).toBe(1);
      });

      it('should create an instance with default retryCooldown', () => {
        const config = new WorkersConfig({});
        expect(config.retryCooldown).toBe(2000);
      });
    });

    describe('when no config object is provided', () => {
      it('should create an instance with default quantity', () => {
        const config = new WorkersConfig();
        expect(config.quantity).toBe(1);
      });

      it('should create an instance with default retryCooldown', () => {
        const config = new WorkersConfig();
        expect(config.retryCooldown).toBe(2000);
      });
    });
  });
});
