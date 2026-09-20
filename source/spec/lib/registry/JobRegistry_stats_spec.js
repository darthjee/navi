import { JobRegistry } from 'deku-swarm';
import { JobRegistryScenarios } from '../../support/utils/JobRegistryScenarios.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  JobRegistryUtils.setup();

  const emptyStats = {
    enqueued: 0,
    processing: 0,
    failed: 0,
    retryQueue: 0,
    finished: 0,
    dead: 0,
    total: 0,
  };

  const expectedTotals = { finished: 1, dead: 1 };

  describe('.stats', () => {
    describe('when no jobs have been added', () => {
      it('returns zero counts for all states', () => {
        expect(JobRegistry.stats()).toEqual(emptyStats);
      });
    });

    JobRegistryScenarios.all().forEach(({ status, description, setup }) => {
      describe(`when ${description}`, () => {
        beforeEach(() => {
          setup({ parameters: { value: 1 } });
        });

        it(`returns ${status} count of 1`, () => {
          expect(JobRegistry.stats()).toEqual({
            ...emptyStats,
            [status]: 1,
            total: expectedTotals[status] ?? 0,
          });
        });
      });
    });
  });
});
