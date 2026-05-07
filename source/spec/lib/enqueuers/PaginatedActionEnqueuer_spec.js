import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { PaginatedActionEnqueuer } from '../../../lib/enqueuers/PaginatedActionEnqueuer.js';
import { Application } from '../../../lib/services/Application.js';
import { PaginatedActionEnqueuerUtils } from '../../support/utils/PaginatedActionEnqueuerUtils.js';

describe('PaginatedActionEnqueuer', () => {
  const ctx = PaginatedActionEnqueuerUtils.setup();

  describe('#enqueue', () => {
    describe('when responseWrapper and parameters are provided', () => {
      const responseWrapper = { parsedBody: { id: 1 }, headers: {} };
      const parameters = { category_id: 5 };

      it('calls enqueue once with the PaginatedAction factory key, paginatedAction, responseWrapper and parameters', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, responseWrapper, parameters).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, responseWrapper, parameters });
      });
    });

    describe('when the application is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(true);
      });

      it('does not call enqueue', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, { parsedBody: {}, headers: {} }, {}).enqueue();
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });
  });
});
