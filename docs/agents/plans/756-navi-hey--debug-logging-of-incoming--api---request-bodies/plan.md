# Plan: navi-hey: debug logging of incoming /api/* request bodies

Issue: [756-navi-hey--debug-logging-of-incoming--api---request-bodies.md](../issues/756-navi-hey--debug-logging-of-incoming--api---request-bodies.md)

## Overview

Add debug-level logging of the method, path, and full request body for every
authorized request to the token-secured `/api/*` namespace, hooked into
`SecuredRequestHandler#handle()`.

See [engine.md](engine.md) for the full plan.
