# Plan: Refactor ApplicationInstance

Issue: [717-refactor-applicationinstance.md](../issues/717-refactor-applicationinstance.md)

## Overview
Split `ApplicationInstance.js`'s six mixed responsibilities into four small collaborator classes (`EngineState`, `RegistriesBuilder`, `ApplicationConfigurator`, `RunReporter`), injected via the constructor, while `ApplicationInstance` itself stays as a thin engine-lifecycle coordinator with its public API and spec-locked behavior fully preserved.

See [engine.md](engine.md) for the full plan.
