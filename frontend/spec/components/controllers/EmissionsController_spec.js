import { flushMany } from 'navi-spec-support/async.js';
import EmissionsController from '../../../src/components/pages/controllers/EmissionsController.jsx';
import noop from '../../../src/utils/noop.js';
import { mockResponses } from '../../support/fetch.js';
import { itBehavesLikePollingController, usePollingController } from '../../support/polling_controller.js';

const COUNTS = { extracted: 4, emitted: 3, failed: 1, dead: 0 };

const emission = (id) => ({ id, status: 'success', url: 'https://a', method: 'POST' });

describe('EmissionsController', () => {
  describe('.build', () => {
    it('returns an EmissionsController instance', () => {
      const view = EmissionsController.build(noop, noop, noop);
      expect(view).toBeInstanceOf(EmissionsController);
    });
  });

  describe('#buildPollingEffect', () => {
    const polling = usePollingController(EmissionsController.build);
    const { state, start } = polling;

    itBehavesLikePollingController(polling, {
      url: '/emissions.json',
      payload: (emissions) => ({ counts: COUNTS, emissions }),
      entry: emission,
      idsOf: (data) => data.rows.map((row) => row.id),
    });

    describe('when emissions are returned on the first poll', () => {
      beforeEach(async () => {
        mockResponses([
          { counts: COUNTS, emissions: [emission(5), emission(6)] },
          { counts: COUNTS, emissions: [] },
        ]);
        start();
        await flushMany();
      });

      it('passes the counts to setData', () => {
        expect(state.setData.calls.mostRecent().args[0].counts).toEqual(COUNTS);
      });
    });

    describe('when the response is empty', () => {
      beforeEach(async () => {
        mockResponses([{ counts: { extracted: 0 }, emissions: [] }]);
        start();
        await flushMany();
      });

      it('still reports the counts', () => {
        expect(state.setData.calls.mostRecent().args[0].counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
      });
    });
  });
});
