import { JobFactory, JobRegistry, WorkerFactory, WorkersRegistry } from 'deku-swarm';
import { ActionProcessingJob } from '../../jobs/ActionProcessingJob.js';
import { AssetDownloadJob } from '../../jobs/AssetDownloadJob.js';
import { EmitJob } from '../../jobs/EmitJob.js';
import { ExtractionJob } from '../../jobs/ExtractionJob.js';
import { HtmlParseJob } from '../../jobs/HtmlParseJob.js';
import { PaginatedActionProcessingJob } from '../../jobs/PaginatedActionProcessingJob.js';
import { ResourceRequestJob } from '../../jobs/ResourceRequestJob.js';
import { CssSelectorParser } from '../../parsers/CssSelectorParser.js';
import { JsonPathParser } from '../../parsers/JsonPathParser.js';
import { RegexParser } from '../../parsers/RegexParser.js';
import { ParserRegistry } from '../../registry/ParserRegistry.js';
import { LogContext } from '../../utils/logging/LogContext.js';

/**
 * RegistriesBuilder bootstraps the job factory, job registry, and workers
 * registry from a loaded configuration.
 * @author darthjee
 */
class RegistriesBuilder {
  /**
   * Registers all job factories and builds the parser, job, and workers registries.
   * @param {object} params - Construction parameters.
   * @param {Config} params.config - The loaded application configuration.
   * @param {IdentifyableCollection} [params.workers] - Workers collection (injected for testing).
   * @returns {void}
   */
  build({ config, workers }) {
    JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: config.namespaceMap } });
    JobFactory.build('Action', { klass: ActionProcessingJob });
    JobFactory.build('PaginatedAction', { klass: PaginatedActionProcessingJob });
    JobFactory.build('HtmlParse', { klass: HtmlParseJob, attributes: { jobRegistry: JobRegistry, clientRegistry: config.namespaceMap } });
    JobFactory.build('AssetDownload', { klass: AssetDownloadJob, attributes: { clientRegistry: config.namespaceMap } });

    const parserRegistry = new ParserRegistry({
      regex: new RegexParser(),
      json_path: new JsonPathParser(),
      css: new CssSelectorParser()
    });
    JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry, jobRegistry: JobRegistry } });
    JobFactory.build('Emit', { klass: EmitJob, attributes: { clients: config.namespaceMap } });

    JobRegistry.build({ cooldown: config.workersConfig.retryCooldown, maxRetries: config.workersConfig.maxRetries });

    const loggerFactory = ({ workerId, jobId }) => new LogContext({ workerId, jobId });

    WorkersRegistry.build({
      workers,
      factory: new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory }),
      ...config.workersConfig,
    });
    WorkersRegistry.initWorkers();
  }
}

export { RegistriesBuilder };
