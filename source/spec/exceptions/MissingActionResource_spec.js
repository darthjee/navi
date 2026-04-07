import { MissingActionResource } from '../../lib/exceptions/MissingActionResource.js';

describe('MissingActionResource', () => {
  let error;

  beforeEach(() => {
    error = new MissingActionResource();
  });

  it('has the correct name', () => {
    expect(error.name).toBe('MissingActionResource');
  });

  it('has a message mentioning the resource field', () => {
    expect(error.message).toContain('resource');
  });

  it('is an instance of Error', () => {
    expect(error instanceof Error).toBeTrue();
  });
});
