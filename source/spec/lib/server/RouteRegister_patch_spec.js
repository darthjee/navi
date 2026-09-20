import { RouteRegisterUtils } from '../../support/utils/RouteRegisterUtils.js';

describe('RouteRegister', () => {
  const ctx = RouteRegisterUtils.setup(['patch']);

  describe('#registerPatch', () => {
    RouteRegisterUtils.itBehavesLikeRouteRegistration(ctx, {
      method: 'patch',
      registerName: 'registerPatch',
      httpMethod: 'PATCH',
      route: '/engine/pause',
      failWith: (error) => ({ handle: jasmine.createSpy('handle').and.rejectWith(error) }),
    });
  });
});
