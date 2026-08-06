import { ConfigFileParseError } from '../../../lib/exceptions/ConfigFileParseError.js';

describe('ConfigFileParseError', () => {
  it('sets the message, name and given attributes', () => {
    const cause = new Error('underlying failure');
    const error = new ConfigFileParseError('Failed to read config file "a.yml": underlying failure', {
      path: 'a.yml',
      cause,
    });

    expect(error.message).toBe('Failed to read config file "a.yml": underlying failure');
    expect(error.name).toBe('ConfigFileParseError');
    expect(error.path).toBe('a.yml');
    expect(error.cause).toBe(cause);
    expect(error).toBeInstanceOf(Error);
  });

  it('defaults optional attributes to undefined when not given', () => {
    const error = new ConfigFileParseError('boom');

    expect(error.path).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });
});
