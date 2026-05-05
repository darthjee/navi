import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { PaginatedActionEnqueuer } from '../../../lib/enqueuers/PaginatedActionEnqueuer.js';
import { Application } from '../../../lib/services/Application.js';
import { PaginatedActionEnqueuerUtils } from '../../support/utils/PaginatedActionEnqueuerUtils.js';

describe('PaginatedActionEnqueuer', () => {
  const ctx = PaginatedActionEnqueuerUtils.setup();

  describe('#enqueue', () => {
    describe('when parameters are provided', () => {
      const parameters = { parsedBody: { id: 1 }, headers: {}, parameters: {} };

      it('calls enqueue once with the PaginatedAction factory key, paginatedAction and parameters', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, parameters).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, parameters });
      });
    });

    describe('when the application is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(true);
      });

      it('does not call enqueue', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, { parsedBody: {}, headers: {} }).enqueue();
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });
  });
});
