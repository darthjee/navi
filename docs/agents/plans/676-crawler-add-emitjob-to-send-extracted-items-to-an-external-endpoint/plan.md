# Plan: Crawler: add EmitJob to send extracted items to an external endpoint

Issue: [676-crawler-add-emitjob-to-send-extracted-items-to-an-external-endpoint.md](../issues/676-crawler-add-emitjob-to-send-extracted-items-to-an-external-endpoint.md)

## Overview

Add a new `EmitJob` (in `source/lib/jobs/`) that sends one extracted item to an external endpoint described by the resource's `emit` config. This requires extending `Client` with a POST/PUT/PATCH JSON-body method (today it only performs GET), adding an optional `status` field plus `{:placeholder}` URL substitution to `ResourceRequestEmit`, and registering the new job. Wiring `ExtractionJob` to actually enqueue `EmitJob` instances is out of scope (#677); this plan only builds the job and its dependencies.

See [engine.md](engine.md) for the full plan.
