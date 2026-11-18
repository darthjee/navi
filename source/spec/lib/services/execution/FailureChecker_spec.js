import { JobRegistry } from 'deku-swarm';
import { FailureConfig } from '../../../../lib/models/configs/FailureConfig.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { FailureChecker } from '../../../../lib/services/execution/FailureChecker.js';
import { LifetimeJobStats } from '../../../../lib/services/execution/LifetimeJobStats.js';

describe('FailureChecker', () => {
  const buildStats = ({ total, dead }) => new LifetimeJobStats({ total, dead, unresolved: 0 });

  beforeEach(() => {
    spyOn(process, 'exit').and.stub();
    spyOn(LogRegistry, 'error').and.stub();
  });

  describe('#check', () => {
    describe('when failureConfig is null', () => {
      it('does not call process.exit', () => {
        new FailureChecker({ failureConfig: null, stats: buildStats({ total: 10, dead: 10 }) }).check();
        expect(process.exit).not.toHaveBeenCalled();
      });
    });

    describe('when failureConfig is present', () => {
      const check = (threshold, stats) => {
        new FailureChecker({ failureConfig: new FailureConfig({ threshold }), stats }).check();
      };

      it('exits when the dead ratio is over the threshold', () => {
        check(10, buildStats({ total: 2, dead: 1 }));
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('logs the ratio when over the threshold', () => {
        check(10, buildStats({ total: 2, dead: 1 }));
        expect(LogRegistry.error).toHaveBeenCalledWith(jasmine.stringContaining('50.00%'));
      });

      it('does not exit when within the threshold', () => {
        check(10, buildStats({ total: 10, dead: 0 }));
        expect(process.exit).not.toHaveBeenCalled();
      });

      it('does not exit when the total is zero', () => {
        check(0, buildStats({ total: 0, dead: 0 }));
        expect(process.exit).not.toHaveBeenCalled();
      });

      it('does not read JobRegistry', () => {
        spyOn(JobRegistry, 'stats');
        check(10, buildStats({ total: 2, dead: 1 }));
        expect(JobRegistry.stats).not.toHaveBeenCalled();
      });
    });
  });
});
