# Plan: Crawler: support parser and emit sections in the YAML config

Issue: [673-crawler-support-parser-and-emit-sections-in-the-yaml-config.md](../issues/673-crawler-support-parser-and-emit-sections-in-the-yaml-config.md)

## Overview

Extend the `ResourceRequest` YAML config with two new optional sections — `parser` and `emit` — and expose them as typed values, config-parsing-only (no extraction/emission logic runs in this issue).

See [engine.md](engine.md) for the full plan.
