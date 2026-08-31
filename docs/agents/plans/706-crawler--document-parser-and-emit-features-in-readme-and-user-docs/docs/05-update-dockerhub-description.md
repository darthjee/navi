# Update DOCKERHUB_DESCRIPTION.md

Add one bullet to `DOCKERHUB_DESCRIPTION.md`'s "Key features" list (mirrors `README.md`'s Overview key-features list, currently missing the same items — see `DOCKERHUB_DESCRIPTION.md:17-22`), summarizing the crawler feature at the same one-line depth as the existing bullets (e.g. the `paginated_actions` bullet). Do not add a Fields table, worked examples, retry-policy detail, or endpoint docs here — `DOCKERHUB_DESCRIPTION.md` intentionally stays a condensed summary; link to nothing, just describe the capability in one line, e.g. structured data extraction (`parser`) and emission (`emit`) to external endpoints.

## Files to Change

- `DOCKERHUB_DESCRIPTION.md` — add one "Key features" bullet summarizing structured extraction/emission.
