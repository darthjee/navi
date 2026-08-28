# Plan: Extract responsibilities from ApplicationInstance

Issue: [724_extract-responsibilities-from-applicationinstance.md](../issues/724-extract-responsibilities-from-applicationinstance.md)

## Overview

Extract the engine processing-control/state-transition responsibility out of `ApplicationInstance` into a new `EngineController` class, keeping `ApplicationInstance`'s public API (and, transitively, `Application.js`) unchanged via thin delegator methods.

See [engine.md](engine.md) for the full plan.
