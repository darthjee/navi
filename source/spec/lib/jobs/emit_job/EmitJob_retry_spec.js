import { RequestFailed } from '../../../../lib/exceptions/request/RequestFailed.js';
import { EmitJob } from '../../../../lib/jobs/EmitJob.js';
import { EmitJobSpecUtils } from '../../../support/utils/EmitJobSpecUtils.js';
import { JobRegistryUtils } from '../../../support/utils/JobRegistryUtils.js';

const { fullUrl } = EmitJobSpecUtils;

describe('EmitJob', () => {
  const ctx = EmitJobSpecUtils.setup();
  const fail = (error) => JobRegistryUtils.failSilently(ctx.job, error);

  describe('#maxRetries', () => {
    describe('when no emit.retries override is configured', () => {
      it('returns EmitJob.DEFAULT_MAX_RETRIES', () => {
        expect(ctx.job.maxRetries).toBe(EmitJob.DEFAULT_MAX_RETRIES);
      });
    });

    describe('when emit.retries is configured', () => {
      beforeEach(() => {
        ctx.rebuildJob({ retries: 2 });
      });

      it('returns the configured value', () => {
        expect(ctx.job.maxRetries).toBe(2);
      });
    });

    describe('when the last error is a retryable RequestFailed', () => {
      [500, 502, 503, 429, 408].forEach((statusCode) => {
        it(`keeps the configured maxRetries for a ${statusCode} response`, () => {
          fail(new RequestFailed(statusCode, fullUrl));

          expect(ctx.job.maxRetries).toBe(EmitJob.DEFAULT_MAX_RETRIES);
        });
      });
    });

    describe('when the last error is a non-retryable RequestFailed (any other 4xx)', () => {
      [400, 401, 403, 404, 422].forEach((statusCode) => {
        it(`forces immediate exhaustion for a ${statusCode} response`, () => {
          fail(new RequestFailed(statusCode, fullUrl));

          expect(ctx.job.maxRetries).toBe(ctx.job._attempts);
          expect(ctx.job.exhausted()).toBeTrue();
        });
      });
    });

    describe('when the last error is a network-level error (not a RequestFailed)', () => {
      it('keeps the configured maxRetries, treating it as always retryable', () => {
        fail(new Error('network down'));

        expect(ctx.job.maxRetries).toBe(EmitJob.DEFAULT_MAX_RETRIES);
      });
    });
  });

  describe('#cooldown', () => {
    describe('when no emit.cooldown override is configured and there is no Retry-After to honor', () => {
      it('returns EmitJob.DEFAULT_COOLDOWN', () => {
        expect(ctx.job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
      });
    });

    describe('when emit.cooldown is configured', () => {
      beforeEach(() => {
        ctx.rebuildJob({ cooldown: 1234 });
      });

      it('returns the configured value', () => {
        expect(ctx.job.cooldown).toBe(1234);
      });
    });

    describe('when the last error is a 429 with a parseable Retry-After header', () => {
      it('returns the Retry-After value converted to milliseconds', () => {
        fail(new RequestFailed(429, fullUrl, 'Request failed', { 'retry-after': '10' }));

        expect(ctx.job.cooldown).toBe(10000);
      });

      it('caps the value at EmitJob.RETRY_AFTER_CAP_MS', () => {
        fail(new RequestFailed(429, fullUrl, 'Request failed', { 'retry-after': '120' }));

        expect(ctx.job.cooldown).toBe(EmitJob.RETRY_AFTER_CAP_MS);
      });
    });

    [
      {
        description: 'when the last error is a 429 without a Retry-After header',
        title: 'falls back to the configured cooldown',
        error: () => new RequestFailed(429, fullUrl),
      },
      {
        description: 'when the last error is a 429 with a non-numeric Retry-After header',
        title: 'falls back to the configured cooldown',
        error: () => new RequestFailed(429, fullUrl, 'Request failed', { 'retry-after': 'not-a-number' }),
      },
      {
        description: 'when the last error is a 429 with an HTTP-date Retry-After header',
        title: 'treats it as unparseable and falls back to the configured cooldown',
        error: () => new RequestFailed(
          429, fullUrl, 'Request failed', { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' },
        ),
      },
      {
        description: 'when the last error is a non-429 RequestFailed carrying a Retry-After-like header',
        title: 'returns the configured cooldown, ignoring the header',
        error: () => new RequestFailed(503, fullUrl, 'Request failed', { 'retry-after': '10' }),
      },
    ].forEach(({ description, title, error }) => {
      describe(description, () => {
        it(title, () => {
          fail(error());

          expect(ctx.job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
        });
      });
    });
  });
});
