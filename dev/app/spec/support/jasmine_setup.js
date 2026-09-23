import { Logger } from 'deku-sprout';

globalThis.beforeEach(() => {
  Logger.suppress();
});

globalThis.afterEach(() => {
  Logger.reset();
});
