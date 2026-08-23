# Plan: Crawler: register ExtractionJob and EmitJob in the frontend job-class constants

Issue: [678-crawler-register-extractionjob-and-emitjob-in-the-frontend-job-class-constants.md](../../issues/678-crawler-register-extractionjob-and-emitjob-in-the-frontend-job-class-constants.md)

## Overview
Register the `EmitJob` backend job class in the frontend's job-class filter so it renders correctly in the monitoring dashboard instead of falling back to unknown/generic display. `ExtractionJob` was already registered by #674/#681; this plan covers only the remaining `EmitJob` gap.

See [frontend.md](frontend.md) for the full plan.
