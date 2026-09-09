import { RequestHandler as ExtensionRequestHandler } from 'navi-hey/extension';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';

describe('navi-hey/extension specifier', () => {
  it('resolves to a class via Node self-referencing', () => {
    expect(typeof ExtensionRequestHandler).toBe('function');
  });

  it('is the same class as the internal lib/common path', () => {
    expect(ExtensionRequestHandler).toBe(RequestHandler);
  });
});
