# Plan: Refactor ApplicationInstance to rely on EngineController

Issue: [735-refactor-applicationinstance-to-rely-on-enginecontroller.md](../../issues/735-refactor-applicationinstance-to-rely-on-enginecontroller.md)

## Overview
Move engine construction, event wiring, and initial-launch sequencing out of `ApplicationInstance` and into `EngineController`, which already owns the rest of the engine's lifecycle. `WebServer`/`ServerController` extraction and aggregator-driven starts are out of scope here (tracked in #736/#737).

See [engine.md](engine.md) for the full plan.
