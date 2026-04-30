/**
 * The exhaustive list of known job classes used as the single source of truth
 * for the job-class filter dropdown in the UI.
 *
 * **Must be updated whenever a new job class is added to the backend.**
 * See `docs/agents/contributing.md` for details.
 */
const JOB_CLASSES = [
  'ResourceRequestJob',
  'ActionProcessingJob',
  'HtmlParseJob',
  'AssetDownloadJob',
];

export { JOB_CLASSES };
