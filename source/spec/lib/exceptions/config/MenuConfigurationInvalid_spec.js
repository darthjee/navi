import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { MenuConfigurationInvalid } from '../../../../lib/exceptions/config/MenuConfigurationInvalid.js';

describe('MenuConfigurationInvalid', () => {
  let error;

  beforeEach(() => {
    error = new MenuConfigurationInvalid('config/menu.yml', '"entries" must be a list');
  });

  it('has the correct name', () => {
    expect(error.name).toBe('MenuConfigurationInvalid');
  });

  it('has a message naming the offending file and reason', () => {
    expect(error.message).toBe('Invalid menu configuration file: config/menu.yml ("entries" must be a list)');
  });

  it('exposes the file', () => {
    expect(error.file).toEqual('config/menu.yml');
  });

  it('exposes the reason', () => {
    expect(error.reason).toEqual('"entries" must be a list');
  });

  describe('when no reason is given', () => {
    it('builds a message from the file alone', () => {
      expect(new MenuConfigurationInvalid('config/menu.yml').message)
        .toBe('Invalid menu configuration file: config/menu.yml');
    });
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
