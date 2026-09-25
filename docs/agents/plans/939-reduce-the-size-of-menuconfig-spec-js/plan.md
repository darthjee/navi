# Plan: Reduce the size of MenuConfig_spec.js

Issue: [939-reduce-the-size-of-menuconfig-spec-js.md](../../issues/939-reduce-the-size-of-menuconfig-spec-js.md)

## Overview
Bring `source/spec/lib/models/configs/MenuConfig_spec.js` (322 lines) under the 300-line spec size limit without losing coverage. Do this by moving the temporary YAML file handling into a support util, checking the "empty-ish file → defaults" cases from one example table, and moving the merge-behavior scenarios into a sibling spec. All the work is in `source/`.

See [engine.md](engine.md) for the full plan.
