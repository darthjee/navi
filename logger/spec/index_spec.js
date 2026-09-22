import * as index from '../lib/index.js';

describe('index', () => {
  it('loads as a module', () => {
    expect(typeof index).toEqual('object');
  });
});
