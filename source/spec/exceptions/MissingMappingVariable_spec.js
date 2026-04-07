import { MissingMappingVariable } from '../../lib/exceptions/MissingMappingVariable.js';

describe('MissingMappingVariable', () => {
  const variable = 'kind_id';

  let error;

  beforeEach(() => {
    error = new MissingMappingVariable(variable);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('MissingMappingVariable');
  });

  it('includes the variable name in its message', () => {
    expect(error.message).toContain(variable);
  });

  it('exposes the variable name', () => {
    expect(error.variable).toBe(variable);
  });

  it('is an instance of Error', () => {
    expect(error instanceof Error).toBeTrue();
  });
});
