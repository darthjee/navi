import { JobsFilter } from '../../../lib/server/JobsFilter.js';

describe('JobsFilter', () => {
  const jobA = { constructor: { name: 'ResourceRequestJob' } };
  const jobB = { constructor: { name: 'ActionProcessingJob' } };
  const jobC = { constructor: { name: 'HtmlParseJob' } };
  const allJobs = [jobA, jobB, jobC];

  describe('#filter', () => {
    describe('when no filters are provided', () => {
      it('returns all jobs', () => {
        const filter = new JobsFilter(allJobs, {});

        expect(filter.filter()).toEqual(allJobs);
      });
    });

    describe('when class filter is absent', () => {
      it('returns all jobs', () => {
        const filter = new JobsFilter(allJobs);

        expect(filter.filter()).toEqual(allJobs);
      });
    });

    describe('when class filter is an empty array', () => {
      it('returns all jobs', () => {
        const filter = new JobsFilter(allJobs, { class: [] });

        expect(filter.filter()).toEqual(allJobs);
      });
    });

    describe('when a single class filter is provided as an array', () => {
      it('returns only jobs matching that class', () => {
        const filter = new JobsFilter(allJobs, { class: ['ResourceRequestJob'] });

        expect(filter.filter()).toEqual([jobA]);
      });
    });

    describe('when a single class filter is provided as a string (query string edge case)', () => {
      it('returns only jobs matching that class', () => {
        const filter = new JobsFilter(allJobs, { class: 'ActionProcessingJob' });

        expect(filter.filter()).toEqual([jobB]);
      });
    });

    describe('when multiple class filters are provided', () => {
      it('returns jobs matching any of the classes', () => {
        const filter = new JobsFilter(allJobs, { class: ['ResourceRequestJob', 'HtmlParseJob'] });

        expect(filter.filter()).toEqual([jobA, jobC]);
      });
    });

    describe('when an unknown class is provided', () => {
      it('returns an empty list', () => {
        const filter = new JobsFilter(allJobs, { class: ['UnknownJob'] });

        expect(filter.filter()).toEqual([]);
      });
    });
  });
});
