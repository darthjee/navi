import * as index from '../lib/index.js';

describe('index', () => {
  it('loads as a module', () => {
    expect(typeof index).toEqual('object');
  });

  it('exports BaseLogger', () => {
    expect(index.BaseLogger).toBeDefined();
  });

  it('exports ConsoleLogger', () => {
    expect(index.ConsoleLogger).toBeDefined();
  });

  it('exports LoggerGroup', () => {
    expect(index.LoggerGroup).toBeDefined();
  });

  it('exports Logger', () => {
    expect(index.Logger).toBeDefined();
  });
});
