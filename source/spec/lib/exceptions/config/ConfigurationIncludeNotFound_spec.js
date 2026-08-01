import { ConfigurationFileNotFound } from '../../../../lib/exceptions/config/ConfigurationFileNotFound.js';
import { ConfigurationIncludeNotFound } from '../../../../lib/exceptions/config/ConfigurationIncludeNotFound.js';

describe('ConfigurationIncludeNotFound', () => {
  let error;

  beforeEach(() => {
    error = new ConfigurationIncludeNotFound('/path/to/included.yml');
  });

  it('has the correct name', () => {
    expect(error.name).toBe('ConfigurationIncludeNotFound');
  });

  it('has a message mentioning the file path', () => {
    expect(error.message).toBe('Configuration file not found: /path/to/included.yml');
  });

  it('is an instance of ConfigurationFileNotFound', () => {
    expect(error).toBeInstanceOf(ConfigurationFileNotFound);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
