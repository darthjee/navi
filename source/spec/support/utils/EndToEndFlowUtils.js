import axios from 'axios';
import { JobFactory, JobRegistry } from 'deku-swarm';
import { JsonPathParser } from '../../../lib/parsers/JsonPathParser.js';
import { RegexParser } from '../../../lib/parsers/RegexParser.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';
import { ClientFactory } from '../factories/ClientFactory.js';
import { LogContextUtils } from './LogContextUtils.js';
import { LoggerUtils } from './LoggerUtils.js';

/**
 * Test utility shared by the end-to-end extraction/emit flow specs, which drive real
 * job chains through the real JobFactory/JobRegistry.
 */
class EndToEndFlowUtils {
  /**
   * Installs the common beforeEach (stubbed logger, logContext spy, JobRegistry with no
   * cooldown) and afterEach (JobRegistry and JobFactory reset).
   * @returns {{ logContext: jasmine.SpyObj }} Context object populated before each spec.
   */
  static setup() {
    const ctx = {};

    beforeEach(() => {
      LoggerUtils.stubLoggerMethods();
      ctx.logContext = LogContextUtils.build();

      JobRegistry.build({ cooldown: -1 });
    });

    afterEach(() => {
      JobRegistry.reset();
      JobFactory.reset();
    });

    return ctx;
  }

  /**
   * Returns the enqueued jobs that are instances of the given class.
   * @param {Function} klass - Job class to filter by.
   * @returns {Array<object>} Enqueued jobs of the given class.
   */
  static enqueued(klass) {
    return JobRegistry.jobsByStatus('enqueued').filter((job) => job instanceof klass);
  }

  /**
   * Checks whether any job of the given class is enqueued.
   * @param {Function} klass - Job class to look for.
   * @returns {boolean} True when at least one job of the class is enqueued.
   */
  static hasEnqueued(klass) {
    return EndToEndFlowUtils.enqueued(klass).length > 0;
  }

  /**
   * Performs each job sequentially.
   * @param {Array<object>} jobs - Jobs to perform.
   * @param {object} logContext - Log context passed to each job.
   * @returns {Promise<void>} Resolves once every job has been performed.
   */
  static async performAll(jobs, logContext) {
    for (const job of jobs) {
      await job.perform(logContext);
    }
  }

  /**
   * Asserts that the emit HTTP boundary was called with the given URL and body.
   * @param {string} url - Expected emit URL.
   * @param {object} body - Expected emit body.
   * @returns {void}
   */
  static expectEmitted(url, body) {
    expect(axios.post).toHaveBeenCalledWith(url, body, jasmine.anything());
  }

  /**
   * Builds a ParserRegistry with the json_path and regex parsers.
   * @returns {ParserRegistry} The parser registry.
   */
  static buildParserRegistry() {
    return new ParserRegistry({ json_path: new JsonPathParser(), regex: new RegexParser() });
  }

  /**
   * Builds the example `lootstudios` / `majora_api` clients map.
   * @returns {{ lootstudios: Client, majora_api: Client }} Clients keyed by name.
   */
  static exampleClients() {
    return {
      lootstudios: ClientFactory.build({ name: 'lootstudios', baseUrl: 'https://app.lootstudios.com' }),
      majora_api: ClientFactory.build({ name: 'majora_api', baseUrl: 'https://majora.example.com' }),
    };
  }
}

export { EndToEndFlowUtils };
