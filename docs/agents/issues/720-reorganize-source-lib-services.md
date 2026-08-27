# Issue: Reorganize source/lib/services

## Problem

`source/lib/services` has 16 loose files mixing unrelated responsibilities
(application bootstrap, config loading, engine state, run reporting, HTTP
client, CLI parsing). This makes the folder hard to navigate and forces
readers to scan every file to find a collaborator. The project already
groups related files into subfolders elsewhere (e.g. `models/configs/`),
so this folder is an outlier.

## Solution

Group the files by responsibility:

- `application/` — application bootstrap and lifecycle
  - `Application.js`
  - `ApplicationConfigurator.js`
  - `ApplicationInstance.js`
  - `ArgumentsParser.js`
- `config/` — config loading and parsing
  - `ConfigIncluder.js`
  - `ConfigLoader.js`
  - `ConfigParser.js`
- `engine/` — engine state and events
  - `EngineEvents.js`
  - `EngineState.js`
  - `EngineStopService.js`
- `execution/` — run finalization and reporting
  - `RunReporter.js`
  - `RunSummary.js`
  - `FailureChecker.js`
- `builders/` — registry and namespace bootstrap
  - `RegistriesBuilder.js`
  - `NamespaceMapBuilder.js`

`Client.js` moves out of `services/` into a dedicated `source/lib/client/`
folder: it is HTTP infrastructure rather than a business service, and it
will be split into smaller responsibilities in the future.

Move the matching specs in `source/spec/lib/services/` (and into
`source/spec/lib/client/` for the client) alongside their sources, and
update all ~52 files across `source/` that import from
`lib/services/*`. No behavior change.

### Checklist

- [ ] Move the 16 source files into the proposed subfolders
- [ ] Move the matching specs and update imports
- [ ] `yarn test`, `yarn lint` and `yarn report` green
