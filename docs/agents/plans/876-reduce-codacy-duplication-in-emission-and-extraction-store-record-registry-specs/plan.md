# Plan: Reduce Codacy duplication in emission and extraction store/record/registry specs

Issue: [876-reduce-codacy-duplication-in-emission-and-extraction-store-record-registry-specs.md](../../issues/876-reduce-codacy-duplication-in-emission-and-extraction-store-record-registry-specs.md)

## Overview
Move the scenarios shared by the mirrored Emission* / Extraction* specs (Store, Record, RegistryInstance) into three parameterised shared-example helpers under `source/spec/support/utils/`, and call them from the six spec files. Only spec/support files change; no production code is touched.

See [engine.md](engine.md) for the full plan.
