import { RouteRegisterUtils } from '../../support/utils/RouteRegisterUtils.js';

describe('RouteRegister', () => {
  const ctx = RouteRegisterUtils.setup(['get']);

  describe('#register', () => {
    RouteRegisterUtils.itBehavesLikeRouteRegistration(ctx, {
      method: 'get',
      registerName: 'register',
      httpMethod: 'GET',
      route: '/stats.json',
      failWith: (error) => ({ handle: jasmine.createSpy('handle').and.throwError(error) }),
    });
  });
});
