# Integration: Fetch CSS from HTML Responses

## Step 7 — Update `ResourceRequest`

File: `source/lib/models/ResourceRequest.js`

- `fromObject()` — parse the optional `assets` list into `AssetRequest[]` via `AssetRequest.fromListObject()`. When the key is absent, store an empty array.
- Add `enqueueAssets(rawHtml, jobRegistry, clientRegistry)` — enqueues one `HtmlParseJob` passing `rawHtml`, the stored `AssetRequest[]`, `jobRegistry`, and `clientRegistry`.
- Add `hasAssets()` convenience getter — returns `true` when the `assets` list is non-empty.

## Step 8 — Update `ResourceRequestJob`

File: `source/lib/models/ResourceRequestJob.js`

After a successful HTTP response:

- If `resourceRequest.hasAssets()`:
  - Pass the raw response body directly to `resourceRequest.enqueueAssets(rawBody, jobRegistry, clientRegistry)`.
  - Do **not** call `ResponseParser` (the response is HTML, not JSON).
- If the resource also has `actions`, enqueue them via the existing `resourceRequest.enqueueActions(responseWrapper)` path — both branches are independent.
- If the resource has only `actions` (no `assets`), existing behaviour is unchanged.

## Step 9 — Update `ConfigParser`

File: `source/lib/services/ConfigParser.js`

No changes are expected here if `ResourceRequest.fromObject()` already handles the `assets` key (Step 7). Verify that the raw YAML object is passed through without stripping unknown keys.

## Step 10 — Register job factories in `Application`

File: `source/lib/services/Application.js`

Register the two new factories during `loadConfig`, analogous to existing job factory registrations:

```js
JobFactory.build('HtmlParse', (params) => new HtmlParseJob(params));
JobFactory.build('AssetDownload', (params) => new AssetDownloadJob(params));
```

Ensure `clientRegistry` is injected where needed (both jobs require it).
