import { Config } from '../../../../lib/models/configs/Config.js';
import { EmitConfig } from '../../../../lib/models/configs/EmitConfig.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';

describe('Config', () => {
  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('#emitConfig', () => {
    describe('when no emitConfig is provided', () => {
      it('defaults to an EmitConfig with the default size', () => {
        const config = new Config({ namespaceMap: {} });

        expect(config.emitConfig).toBeInstanceOf(EmitConfig);
        expect(config.emitConfig.size).toBe(100);
      });
    });

    describe('when an emitConfig is provided', () => {
      it('keeps the provided instance', () => {
        const emitConfig = new EmitConfig({ size: 7 });
        const config = new Config({ namespaceMap: {}, emitConfig });

        expect(config.emitConfig).toBe(emitConfig);
        expect(config.emitConfig.size).toBe(7);
      });
    });
  });
});
