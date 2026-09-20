import { JobLifecycleExamples } from './JobLifecycleExamples.js';
import { LogContextUtils } from './LogContextUtils.js';

/**
 * Shared examples for jobs that delegate their work to an action (`ActionProcessingJob`,
 * `PaginatedActionProcessingJob`).
 *
 * Call it from inside the job's own `describe`; the registered spec names read exactly
 * as if they had been written inline.
 */
class ActionJobExamples {
  /**
   * Registers the constructor, `#maxRetries`, `#arguments`, `#perform` and `#exhausted`
   * specs for an action based job.
   * @param {object} params - Example parameters.
   * @param {function(new: Job, object)} params.jobClass - The job class under test.
   * @param {string} params.actionKey - The constructor key carrying the action (e.g. `action`).
   * @param {string} params.actionLabel - How the action is called in descriptions (e.g. `paginated action`).
   * @param {function(): object} params.buildInputs - Builds the constructor attributes carrying the
   * action input (e.g. `{ item }`). They are also the expected `arguments` of the job.
   * @param {function(object): Array} params.expectedExecuteArguments - Maps the inputs built by
   * `buildInputs` to the arguments `action.execute` is expected to receive.
   * @param {string} params.argumentsDescription - Description of the `#arguments` spec.
   * @param {string} params.executeDescription - Description of the spec asserting `action.execute` is called.
   * @param {number} [params.maxRetries=1] - The job's expected `maxRetries`.
   */
  static register({
    jobClass,
    actionKey,
    actionLabel,
    buildInputs,
    expectedExecuteArguments,
    argumentsDescription,
    executeDescription,
    maxRetries = 1,
  }) {
    let action;
    let inputs;
    let job;
    let logContext;

    const buildJob = (extraAttributes = {}) => new jobClass({
      id: 'test-id',
      [actionKey]: action,
      ...inputs,
      ...extraAttributes,
    });

    beforeEach(() => {
      logContext = LogContextUtils.build();
      action = jasmine.createSpyObj(actionKey, ['execute']);
      inputs = buildInputs();
      job = buildJob();
    });

    describe('#constructor', () => {
      JobLifecycleExamples.identityExamples({ getJob: () => job, expectedId: 'test-id' });
    });

    describe('#maxRetries', () => {
      it(`returns ${maxRetries}`, () => {
        expect(job.maxRetries).toBe(maxRetries);
      });
    });

    describe('#arguments', () => {
      it(argumentsDescription, () => {
        expect(job.arguments).toEqual(inputs);
      });

      describe('when originUrl is provided', () => {
        it('includes originUrl in the arguments', () => {
          const originUrl = 'https://example.com/items.json';
          const jobWithOrigin = buildJob({ originUrl });
          expect(jobWithOrigin.arguments).toEqual({ ...inputs, originUrl });
        });
      });

      describe('when originUrl is not provided', () => {
        it('does not include originUrl in the arguments', () => {
          expect(job.arguments.originUrl).toBeUndefined();
        });
      });
    });

    describe('#perform', () => {
      describe(`when the ${actionLabel} succeeds`, () => {
        it(executeDescription, async () => {
          await job.perform(logContext);
          expect(action.execute).toHaveBeenCalledOnceWith(...expectedExecuteArguments(inputs));
        });

        JobLifecycleExamples.successExamples({ getJob: () => job, getLogContext: () => logContext });
      });

      describe(`when the ${actionLabel} throws`, () => {
        const error = new Error(`${actionLabel} error`);

        beforeEach(() => {
          action.execute.and.throwError(error);
        });

        it('sets lastError to the thrown error', async () => {
          await job.perform(logContext).catch(() => {});
          expect(job.lastError).toEqual(error);
        });

        it('rethrows the error', async () => {
          await expectAsync(job.perform(logContext)).toBeRejectedWith(error);
        });

        JobLifecycleExamples.exhaustionExample({
          getJob: () => job,
          getLogContext: () => logContext,
          maxRetries,
          description: 'is exhausted after one failure',
        });
      });
    });

    describe('#exhausted', () => {
      it('returns false with zero attempts', () => {
        expect(job.exhausted()).toBeFalse();
      });

      it('returns true after one failed attempt', async () => {
        action.execute.and.throwError(new Error('fail'));
        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeTrue();
      });
    });
  }
}

export { ActionJobExamples };
