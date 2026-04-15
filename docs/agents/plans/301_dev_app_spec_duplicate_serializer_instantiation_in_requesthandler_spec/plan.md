# Plan: dev/app/spec — Duplicate Serializer instantiation in RequestHandler_spec

## Overview

Extract the duplicated `new Serializer(['id', 'name'])` instantiations into a single shared constant at the top of the outer `describe('RequestHandler')` block, so both inner `describe` blocks reference the same instance.

## Context

`spec/lib/RequestHandler_spec.js` creates two separate `new Serializer(['id', 'name'])` instances with identical configuration in two different `describe` blocks. If the attribute list changes, both lines must be updated independently, risking test drift if only one is updated.

## Implementation Steps

### Step 1 — Locate the duplicate declarations

Find the two `new Serializer(['id', 'name'])` declarations inside:
- `describe('with a custom extractorFactory')`
- `describe('with a serializer')`

### Step 2 — Extract a shared constant

Add `const defaultSerializer = new Serializer(['id', 'name']);` at the top of the outer `describe('RequestHandler')` block, before the inner `describe` blocks.

### Step 3 — Replace local references

Remove both local `serializer` (or equivalent) declarations and replace all references with `defaultSerializer`.

## Files to Change

- `dev/app/spec/lib/RequestHandler_spec.js` — extract shared serializer constant, replace both local declarations with `defaultSerializer`

## Notes

- Pure refactor, no behavior change — tests should pass unchanged after the edit.
