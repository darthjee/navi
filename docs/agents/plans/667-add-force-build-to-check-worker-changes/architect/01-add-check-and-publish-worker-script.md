# Add the check-and-publish-worker script

Create `scripts/ci/check-and-publish-worker.sh`, the single script backing
the new `check-and-publish-worker` CI job. It must, in order:

1. Detect whether `worker/` changed since the last worker release tag —
   reuse the `git describe --tags --abbrev=0 --match='worker-*'
   --match='[0-9]*.[0-9]*.[0-9]*'` + `git diff --quiet <tag>..HEAD --
   worker/` logic from the old `scripts/ci/check-worker-changes.sh` — OR
   treat it as changed when `FORCE_WORKER_BUILD` is `"true"`.
2. If neither condition holds, print a short message and `exit 0` (no-op —
   nothing published, no error).
3. Otherwise, read `WORKER_VERSION` from `worker/package.json`
   (`node -p "require('./worker/package.json').version"`).
4. **npm publish, independently idempotent**: check via
   `npm view "deku-swarm@$WORKER_VERSION" version` whether that version is
   already published (same check as `scripts/ci/check-npm-version.sh`, but
   as a plain conditional — do **not** call `circleci-agent step halt`,
   since that would also skip the tag-push logic below). If not published:
   install `worker/`'s deps and run `npm publish --access public` from
   `worker/` (reuse `scripts/ci/publish.sh`'s `~/.npmrc` + `npm publish`
   pattern, e.g. by calling `scripts/ci.sh publish worker` after deps are
   installed). If already published, skip with a log message and fall
   through — do not exit.
5. **Git tag push, independently idempotent**: compute
   `TAG="worker-$WORKER_VERSION"`. Check whether it already exists (locally
   via `git rev-parse "$TAG"` and/or on the remote via
   `git ls-remote --tags origin "refs/tags/$TAG"`). If it doesn't exist:
   configure `git config user.name`/`user.email` for the CI commit (e.g.
   `"Navi CI" <ci@navi.local>`), create an annotated tag, and push it to
   `origin` using the new `GH_PUSH_TOKEN` CircleCI project env var (e.g.
   `git push "https://x-access-token:${GH_PUSH_TOKEN}@github.com/darthjee/navi.git" "$TAG"`
   — never echo/log the token). If the tag already exists, skip with a log
   message.
6. Steps 4 and 5 must run independently of each other — a skip in step 4
   must not prevent step 5 from running, and vice versa.

Wire the script into `scripts/ci.sh` the same way every other action is
wired: add a `check-and-publish-worker) bash "$DIR/ci/check-and-publish-worker.sh" "$@" ;;`
case.

## Files to Change

- `scripts/ci/check-and-publish-worker.sh` — new script (behavior above).
- `scripts/ci.sh` — add the `check-and-publish-worker` case.
