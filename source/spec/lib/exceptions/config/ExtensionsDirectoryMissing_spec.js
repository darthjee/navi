import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { ExtensionsDirectoryMissing } from '../../../../lib/exceptions/config/ExtensionsDirectoryMissing.js';

describe('ExtensionsDirectoryMissing', () => {
  let error;

  beforeEach(() => {
    error = new ExtensionsDirectoryMissing('/navi/extensions');
  });

  it('has the correct name', () => {
    expect(error.name).toBe('ExtensionsDirectoryMissing');
  });

  it('has a message naming the offending path', () => {
    expect(error.message).toContain('/navi/extensions');
  });

  it('exposes the dir', () => {
    expect(error.dir).toEqual('/navi/extensions');
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
