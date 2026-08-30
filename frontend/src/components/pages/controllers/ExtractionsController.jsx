import fetchEmissions from '../../../clients/EmissionsClient.js';
import fetchExtractions from '../../../clients/ExtractionsClient.js';

const REFRESH_MS = 5000;

class ExtractionsController {
  #setData;
  #setError;
  #setLoading;

  constructor(setData, setError, setLoading) {
    this.#setData = setData;
    this.#setError = setError;
    this.#setLoading = setLoading;
  }

  static build(setData, setError, setLoading) {
    return new ExtractionsController(setData, setError, setLoading);
  }

  buildEffect() {
    return () => {
      this.#load();
      const interval = setInterval(() => this.#load(), REFRESH_MS);
      return () => clearInterval(interval);
    };
  }

  #load() {
    Promise.all([fetchExtractions(), fetchEmissions()])
      .then(([extractions, emissions]) => {
        this.#setData(this.#buildViewModel(extractions, emissions));
        this.#setError(null);
      })
      .catch((err) => this.#setError(err.message))
      .finally(() => this.#setLoading(false));
  }

  #buildViewModel(extractionsResponse, emissionsResponse) {
    const extractions = extractionsResponse?.extractions ?? [];
    const emissions = emissionsResponse?.emissions ?? [];
    const groups = this.#groupByExtractionId(emissions);
    const oldestEmissionId = this.#smallestId(emissions);
    const smallestExtractionId = this.#smallestId(extractions);
    const truncated = oldestEmissionId !== null
      && smallestExtractionId !== null
      && oldestEmissionId > smallestExtractionId;

    return {
      extractedTotal: extractionsResponse?.counts?.extracted ?? 0,
      rows: extractions.map((extraction) => this.#buildRow(extraction, groups, truncated)),
    };
  }

  #buildRow(extraction, groups, truncated) {
    const group = groups[extraction.id] ?? [];

    return {
      id: extraction.id,
      timestamp: extraction.timestamp,
      originUrl: extraction.originUrl,
      parserType: extraction.parserType,
      itemCount: extraction.itemCount,
      emitsSent: group.length,
      statusBreakdown: this.#statusBreakdown(group),
      partial: truncated && group.length === 0,
    };
  }

  #groupByExtractionId(emissions) {
    const groups = {};

    emissions.forEach((emission) => {
      const key = emission.extractionId;
      if (key === null || key === undefined) return;
      if (!groups[key]) groups[key] = [];
      groups[key].push(emission);
    });

    return groups;
  }

  #statusBreakdown(group) {
    return group.reduce((acc, emission) => {
      if (emission.status in acc) acc[emission.status] += 1;
      return acc;
    }, { success: 0, failed: 0, dead: 0 });
  }

  #smallestId(records) {
    if (records.length === 0) return null;
    return records.reduce((min, record) => (record.id < min ? record.id : min), records[0].id);
  }
}

export default ExtractionsController;
