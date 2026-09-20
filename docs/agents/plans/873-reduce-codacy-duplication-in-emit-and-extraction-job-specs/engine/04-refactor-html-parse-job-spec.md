# Refactor HtmlParseJob_spec.js
`HtmlParseJob_spec.js` (8 clones) constructs `new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry })` ~12 times, always preceded by an `assetRequests = ...` assignment, and repeats `spyOn(HtmlParser, 'parse').and.returnValue([...]); await job.perform(logContext); expect(jobRegistry.enqueue).toHaveBeenCalledWith('AssetDownload', jasmine.objectContaining({ url }))`.

- Replace inline constructions with `HtmlParseJobFactory.build({...})` (step 01).
- Parameterise the "URL resolution" block and the "enqueues one AssetDownloadJob per discovered URL" case as a table of `{ description, discovered, expectedUrl }` (https / http / protocol-relative / root-relative / `/styles.css`), driven by one `it`.
- Merge the two `originUrl` provided / not provided pairs in `#arguments` where they only differ by input.
- Keep the multi-rule `callFake` scenario and the failure/`exhausted` scenarios intact.

## Files to Change
- `source/spec/lib/jobs/HtmlParseJob_spec.js` — dedupe as above
