# Plan: Extract the shared logging classes and specs into deku-sprout

Issue: [914-extract-the-shared-logging-classes-and-specs-into-deku-sprout.md](../../issues/914-extract-the-shared-logging-classes-and-specs-into-deku-sprout.md)

## Overview

Give `deku-sprout` (`logger/`) its own copy of `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger`, ported from `source/lib/common/utils/logging/`, with matching specs — without touching any existing consumer.

See [logger.md](logger.md) for the full plan.
