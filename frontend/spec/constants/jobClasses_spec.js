import { JOB_CLASSES } from '../../src/constants/jobClasses.js';

describe('jobClasses', () => {
  describe('JOB_CLASSES', () => {
    it('is an array', () => {
      expect(Array.isArray(JOB_CLASSES)).toBe(true);
    });

    it('contains ResourceRequestJob', () => {
      expect(JOB_CLASSES).toContain('ResourceRequestJob');
    });

    it('contains ActionProcessingJob', () => {
      expect(JOB_CLASSES).toContain('ActionProcessingJob');
    });

    it('contains HtmlParseJob', () => {
      expect(JOB_CLASSES).toContain('HtmlParseJob');
    });

    it('contains AssetDownloadJob', () => {
      expect(JOB_CLASSES).toContain('AssetDownloadJob');
    });
  });
});
