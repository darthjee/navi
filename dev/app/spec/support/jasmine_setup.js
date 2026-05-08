import { Logger } from '../../lib/common/utils/logging/Logger.js';

globalThis.beforeEach(() => {
  Logger.suppress();
});

globalThis.afterEach(() => {
  Logger.reset();
});
