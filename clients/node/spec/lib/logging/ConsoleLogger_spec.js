/* eslint-disable no-console */
import { ConsoleLogger } from '../../../lib/logging/ConsoleLogger.js';

describe('ConsoleLogger', () => {
  let logger;

  beforeEach(() => {
    logger = new ConsoleLogger('debug');
    spyOn(console, 'debug').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();
  });

  it('routes debug messages to console.debug', () => {
    logger.debug('msg');
    expect(console.debug).toHaveBeenCalledWith('msg', {});
  });

  it('routes info messages to console.info', () => {
    logger.info('msg');
    expect(console.info).toHaveBeenCalledWith('msg', {});
  });

  it('routes warn messages to console.warn', () => {
    logger.warn('msg');
    expect(console.warn).toHaveBeenCalledWith('msg', {});
  });

  it('routes error messages to console.error', () => {
    logger.error('msg');
    expect(console.error).toHaveBeenCalledWith('msg', {});
  });

  describe('with attributes', () => {
    it('passes message and attributes to console.debug', () => {
      const attrs = { path: '/tmp/config.yml' };
      logger.debug('msg', attrs);
      expect(console.debug).toHaveBeenCalledWith('msg', attrs);
    });

    it('passes message and attributes to console.info', () => {
      const attrs = { action: 'config' };
      logger.info('msg', attrs);
      expect(console.info).toHaveBeenCalledWith('msg', attrs);
    });

    it('passes message and attributes to console.warn', () => {
      const attrs = { varName: 'API_TOKEN' };
      logger.warn('msg', attrs);
      expect(console.warn).toHaveBeenCalledWith('msg', attrs);
    });

    it('passes message and attributes to console.error', () => {
      const attrs = { status: 500 };
      logger.error('msg', attrs);
      expect(console.error).toHaveBeenCalledWith('msg', attrs);
    });
  });
});
