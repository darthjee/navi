# Plan: navi-hey: debug logging of config $VAR interpolation on disk load

Issue: [755-navi-hey--debug-logging-of-config--var-interpolation-on-disk-load.md](../issues/755-navi-hey--debug-logging-of-config--var-interpolation-on-disk-load.md)

## Overview

Add debug-only logging of `$VAR`/`${VAR}` interpolation to the engine's config
loading (`ConfigIncluder`/`EnvStringResolver`), reusing the exact log format
and code split already shipped for the client in #754
(`clients/node/lib/EnvStringResolver.js` + `ConfigFileParser.js`).

See [engine.md](engine.md) for the full plan.
