/**
 * Converts a job's `endedAt` timestamp into its serialized form.
 */
class EndedAtSerializer {
  /**
   * Serializes the `endedAt` value of a job.
   *
   * @param {object} job - A job instance.
   * @returns {string|null} ISO-8601 string when `endedAt` is a number, otherwise `null`.
   */
  static serialize(job) {
    const endedAt = job.endedAt;

    if (typeof endedAt !== 'number' || Number.isNaN(endedAt)) {
      return null;
    }

    return new Date(endedAt).toISOString();
  }
}

export { EndedAtSerializer };
