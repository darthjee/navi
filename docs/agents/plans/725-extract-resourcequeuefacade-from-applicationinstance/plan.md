# Plan: Extract ResourceQueueFacade from ApplicationInstance

Issue: [725-extract-resourcequeuefacade-from-applicationinstance.md](../issues/725-extract-resourcequeuefacade-from-applicationinstance.md)

## Overview

Move the resource-enqueuing responsibility (`enqueueFirstJobs`/`enqueueResources`) out of `ApplicationInstance` into a new `ResourceQueueFacade` collaborator, following the same constructor-injection pattern already used for `ApplicationConfigurator`/`RunReporter`. `ApplicationInstance` keeps thin public delegator methods so `Application.js`'s static API is untouched.

See [engine.md](engine.md) for the full plan.
