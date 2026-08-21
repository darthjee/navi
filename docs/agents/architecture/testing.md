# Test Layout

All specs live under `source/spec/`:

```
source/spec/
  lib/                  ← mirrors source/lib/ exactly
    enqueuers/
    exceptions/
      config/
      http/
      registry/
      request/
    jobs/
    models/
      configs/
      request/
      response/
    registry/
    serializers/
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
      generators/
      ResourceRequestCollector_spec.js
  support/              ← shared test helpers (factories, dummies, fixtures)
    dummies/
    factories/
    utils/
```

`background/`, `factory/`, and `utils/collections/` moved to `worker/spec/` (mirroring `worker/lib/`) as part of the `deku-swarm` extraction — see [Worker Subsystem](../worker.md).

The naming convention for spec files is `<ClassName>_spec.js`, mirroring the source file's location under `source/lib/`.
