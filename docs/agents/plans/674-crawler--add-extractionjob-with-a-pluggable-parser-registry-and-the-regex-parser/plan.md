# Plan: Crawler: add ExtractionJob with a pluggable parser registry and the regex parser

Issue: [674-crawler--add-extractionjob-with-a-pluggable-parser-registry-and-the-regex-parser.md](../issues/674-crawler--add-extractionjob-with-a-pluggable-parser-registry-and-the-regex-parser.md)

## Overview

Add the extraction step of the crawler pipeline: a new `ExtractionJob` that reads a resource's configured `parser`, dispatches to a pluggable parser implementation via a new `ParserRegistry`, and produces structured items — logged, not yet emitted (emission is a later sub-issue). Ships the job shell plus the `regex` parser, wired to be enqueued in parallel with the existing `ActionProcessingJob`/`HtmlParseJob` whenever a resource declares a `parser`.

## Agents involved

- [engine](engine.md)
- [frontend](frontend.md)

## Shared contracts

- New backend job class name: **`ExtractionJob`**, declared in `source/lib/jobs/ExtractionJob.js` and registered as `JobFactory.build('Extraction', { klass: ExtractionJob, ... })` in `source/lib/services/ApplicationInstance.js`.
- Per `docs/agents/contributing/code-organization.md` ("Adding a New Job Class"), any new backend job class must be added to the frontend's `JOB_CLASSES` array. `frontend` must add the exact string `'ExtractionJob'` to `frontend/src/constants/jobClasses.js`, matching the class name `engine` exports — no other frontend behavior depends on this issue.
