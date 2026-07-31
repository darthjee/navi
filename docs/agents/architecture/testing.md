# Test Layout

All specs live under `source/spec/`:

```
source/spec/
  lib/                  ← mirrors source/lib/ exactly
    background/
    enqueuers/
    exceptions/
      config/
      http/
      registry/
      request/
    factory/
    jobs/
    models/
      configs/
      request/
      response/
    registry/
    server/
      handlers/
        engine/
        jobs/
    common/
      utils/
        env_resolver/
      server/
    services/
    utils/
      logging/
      collections/
      generators/
      ResourceRequestCollector_spec.js
  support/              ← shared test helpers (factories, dummies, fixtures)
    dummies/
    factories/
    utils/
```

The naming convention for spec files is `<ClassName>_spec.js`, mirroring the source file's location under `source/lib/`.
