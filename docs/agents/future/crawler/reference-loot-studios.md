# Reference: Loot Studios Crawling Pattern

This feature is designed with the following real-world crawling pattern as reference:

| Approach | Endpoint | Auth | Return | Use |
|----------|----------|------|--------|-----|
| A — GetMyLootsCache | GET `/wp-admin/admin-ajax.php?action=GetMyLootsCache` | No | JSON | Full catalog of bundles and miniatures |
| B — Load_ObjectExplorer | POST `/wp-admin/admin-ajax.php` | Yes (PHPSESSID) | HTML fragment | Miniatures of a specific bundle |
| C — Image URL parsing | GET `/bundle/{slug}/` | Partial | HTML | inid values embedded in asset URLs |

**Approach A (recommended)** is the primary use case for this feature: fetch the JSON catalog, filter miniatures by `obj_type` and `bnd_inid`, extract fields (`obj_inid`, `obj_title`, `obj_post_id`, `bnd_title`), and emit each miniature to an external registration endpoint.

**Approach B** demonstrates the regex parser use case: fetch the bundle HTML page, apply regex `postid-(\d+)` on the raw body to extract the WordPress post ID, and emit it for further processing.
