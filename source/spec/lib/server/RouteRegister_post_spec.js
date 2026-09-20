import { RouteRegisterUtils } from '../../support/utils/RouteRegisterUtils.js';

describe('RouteRegister', () => {
  const ctx = RouteRegisterUtils.setup(['post']);

  describe('#registerPost', () => {
    RouteRegisterUtils.itBehavesLikeRouteRegistration(ctx, {
      method: 'post',
      registerName: 'registerPost',
      httpMethod: 'POST',
      route: '/api/config',
      failWith: (error) => ({ handle: jasmine.createSpy('handle').and.rejectWith(error) }),
    });
  });
});
