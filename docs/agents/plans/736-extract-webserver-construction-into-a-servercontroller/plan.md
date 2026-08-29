# Plan: Extract WebServer construction into a ServerController

Issue: [736-extract-webserver-construction-into-a-servercontroller.md](../issues/736-extract-webserver-construction-into-a-servercontroller.md)

## Overview

Extract `WebServer` construction and lifecycle out of `ApplicationInstance` into a new `ServerController`, mirroring the `EngineController` split from #735. All affected code lives under `source/`, entirely within the `engine` agent's scope.

See [engine.md](engine.md) for the full plan.
