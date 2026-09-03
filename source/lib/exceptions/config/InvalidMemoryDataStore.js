import { AppError } from '../../common/exceptions/AppError.js';

/**
 * Thrown when a `web.memory.data_store.interval` config value is not a
 * finite number greater than zero. Failing fast here avoids a sampler
 * `setInterval` that fires at ~1 ms and busy-loops the event loop.
 * @author darthjee
 */
class InvalidMemoryDataStore extends AppError {
  /**
   * @param {*} interval - The offending, invalid `data_store.interval` value.
   */
  constructor(interval) {
    super(`Invalid memory data_store interval: ${JSON.stringify(interval)}. Expected a finite number greater than 0`);

    this.interval = interval;
  }
}

export { InvalidMemoryDataStore };
