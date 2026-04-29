# File Movements — Issue #420

All files listed below move to a new path. No files are deleted or renamed — only relocated.

---

## Source files → `source/lib/background/`

| From | To |
|------|----|
| `source/lib/models/Job.js` | `source/lib/background/Job.js` |
| `source/lib/models/Worker.js` | `source/lib/background/Worker.js` |
| `source/lib/registry/JobRegistry.js` | `source/lib/background/JobRegistry.js` |
| `source/lib/registry/JobRegistryInstance.js` | `source/lib/background/JobRegistryInstance.js` |
| `source/lib/registry/WorkersRegistry.js` | `source/lib/background/WorkersRegistry.js` |
| `source/lib/registry/WorkersRegistryInstance.js` | `source/lib/background/WorkersRegistryInstance.js` |
| `source/lib/factories/JobFactory.js` | `source/lib/background/JobFactory.js` |
| `source/lib/factories/WorkerFactory.js` | `source/lib/background/WorkerFactory.js` |

## Source files → `source/lib/jobs/`

| From | To |
|------|----|
| `source/lib/models/ResourceRequestJob.js` | `source/lib/jobs/ResourceRequestJob.js` |
| `source/lib/models/ActionProcessingJob.js` | `source/lib/jobs/ActionProcessingJob.js` |
| `source/lib/models/HtmlParseJob.js` | `source/lib/jobs/HtmlParseJob.js` |
| `source/lib/models/AssetDownloadJob.js` | `source/lib/jobs/AssetDownloadJob.js` |

---

## Spec files → `source/spec/lib/background/`

| From | To |
|------|----|
| `source/spec/lib/models/Job_spec.js` | `source/spec/lib/background/Job_spec.js` |
| `source/spec/lib/models/Worker_spec.js` | `source/spec/lib/background/Worker_spec.js` |
| `source/spec/lib/registry/JobRegistry_spec.js` | `source/spec/lib/background/JobRegistry_spec.js` |
| `source/spec/lib/registry/JobRegistryInstance_spec.js` | `source/spec/lib/background/JobRegistryInstance_spec.js` |
| `source/spec/lib/registry/WorkersRegistry_spec.js` | `source/spec/lib/background/WorkersRegistry_spec.js` |
| `source/spec/lib/registry/WorkersRegistryInstance_spec.js` | `source/spec/lib/background/WorkersRegistryInstance_spec.js` |
| `source/spec/lib/factories/JobFactory_spec.js` | `source/spec/lib/background/JobFactory_spec.js` |
| `source/spec/lib/factories/WorkerFactory_spec.js` | `source/spec/lib/background/WorkerFactory_spec.js` |

## Spec files → `source/spec/lib/jobs/`

| From | To |
|------|----|
| `source/spec/lib/models/ResourceRequestJob_spec.js` | `source/spec/lib/jobs/ResourceRequestJob_spec.js` |
| `source/spec/lib/models/ActionProcessingJob_spec.js` | `source/spec/lib/jobs/ActionProcessingJob_spec.js` |
| `source/spec/lib/models/HtmlParseJob_spec.js` | `source/spec/lib/jobs/HtmlParseJob_spec.js` |
| `source/spec/lib/models/AssetDownloadJob_spec.js` | `source/spec/lib/jobs/AssetDownloadJob_spec.js` |

---

## Open questions (not yet assigned)

| File | Current location | Candidates |
|------|-----------------|------------|
| `ActionEnqueuer.js` | `source/lib/models/` | `models/` (stay) or `jobs/` |
| `ActionsEnqueuer.js` | `source/lib/models/` | `models/` (stay) or `jobs/` |
| `AssetRequestEnqueuer.js` | `source/lib/models/` | `models/` (stay) or `jobs/` |
| `Factory.js` | `source/lib/factories/` | `factories/` (stay) or `background/` |
| `ActionEnqueuer_spec.js` | `source/spec/lib/models/` | follows source decision |
| `ActionsEnqueuer_spec.js` | `source/spec/lib/models/` | follows source decision |
| `AssetRequestEnqueuer_spec.js` | `source/spec/lib/models/` | follows source decision |
| `Factory_spec.js` | `source/spec/lib/factories/` | follows source decision |
