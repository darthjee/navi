import { RequestHandlerExecutor } from '../../../lib/common/server/RequestHandlerExecutor.js';
import RedirectHandlerExecutor from '../../../lib/handlers/RedirectHandlerExecutor.js';

describe('RedirectHandlerExecutor', () => {
  const execute = ({ target, params = {}, query = {} }) => {
    const request = { params, query };
    const response = { redirect: jasmine.createSpy('redirect') };
    new RedirectHandlerExecutor(request, response, target).handle();
    return response.redirect.calls.mostRecent().args;
  };

  it('is an instance of RequestHandlerExecutor', () => {
    const executor = new RedirectHandlerExecutor({}, {}, '/#/');
    expect(executor).toBeInstanceOf(RequestHandlerExecutor);
  });

  it('builds redirect location with params and query string', () => {
    const result = execute({
      target: '/#/categories/:id',
      params: { id: '3' },
      query: { search: 'hobbit', order: 'asc' }
    });

    expect(result).toEqual([302, '/#/categories/3?search=hobbit&order=asc']);
  });

  it('filters URL-like query values', () => {
    const result = execute({
      target: '/#/categories',
      query: { redirect: '//evil.com', search: 'hobbit' }
    });

    expect(result).toEqual([302, '/#/categories?search=hobbit']);
  });

  it('falls back to /#/ when redirect destination is unsafe', () => {
    const result = execute({
      target: 'http://example.com/:id',
      params: { id: '7' }
    });

    expect(result).toEqual([302, '/#/']);
  });
});
