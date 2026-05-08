import { Logger } from '../../lib/common/utils/logging/Logger.js';

beforeEach(() => {
  Logger.suppress();
});

afterEach(() => {
  Logger.reset();
});
