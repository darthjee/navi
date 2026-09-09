#!/bin/bash
#
# Smoke test for the downstream extension workflow.
#
# Boots against a running navi_extensions_app (docker compose) and asserts that
# the mounted worked example (examples/navi-orders-extension) is served:
#   1. GET /ext/orders/summary.json  -> backend route handler
#   2. GET /extensions/frontend.json -> frontend bundle manifest
#   3. GET /menu.json                -> menu entry from the mounted config/menu.yml
#
# Usage: SMOKE_PORT=3040 bash scripts/smoke/extensions.sh

set -euo pipefail

SMOKE_HOST="${SMOKE_HOST:-localhost}"
SMOKE_PORT="${SMOKE_PORT:-3040}"
BASE_URL="http://${SMOKE_HOST}:${SMOKE_PORT}"
MAX_WAIT="${SMOKE_MAX_WAIT:-30}"

fail() {
  echo "SMOKE FAIL: $1" >&2
  if [ -n "${2:-}" ]; then
    echo "--- response ---" >&2
    echo "$2" >&2
    echo "----------------" >&2
  fi
  exit 1
}

# JSON query helper: prefers jq, falls back to node.
# json_get '<jq filter>' '<node expression on `d`>' <<< "$body"
json_get() {
  local jq_filter="$1" node_expr="$2" body
  body="$(cat)"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$body" | jq -r "$jq_filter"
  else
    printf '%s' "$body" | node -e '
      let raw = "";
      process.stdin.on("data", c => raw += c);
      process.stdin.on("end", () => {
        const d = JSON.parse(raw);
        const out = (0, eval)(process.argv[1]);
        process.stdout.write(String(out));
      });
    ' "$node_expr"
  fi
}

echo "waiting for ${BASE_URL} (up to ${MAX_WAIT}s) ..."
ready=""
for _ in $(seq 1 "$MAX_WAIT"); do
  if curl -fsS -o /dev/null "${BASE_URL}/ext/orders/summary.json" 2>/dev/null; then
    ready="yes"
    break
  fi
  sleep 1
done
[ -n "$ready" ] || fail "server did not answer on ${BASE_URL} within ${MAX_WAIT}s"

#############################################
# 1. backend route handler
#############################################
resp="$(curl -sS -w '\n%{http_code}' "${BASE_URL}/ext/orders/summary.json")"
code="$(printf '%s' "$resp" | tail -n1)"
body="$(printf '%s' "$resp" | sed '$d')"
[ "$code" = "200" ] || fail "GET /ext/orders/summary.json returned HTTP $code" "$body"

service="$(printf '%s' "$body" | json_get '.service' 'd.service')"
[ "$service" = "orders-extension" ] || fail "summary.json .service != 'orders-extension' (got '$service')" "$body"

pending_type="$(printf '%s' "$body" | json_get '(.pending | type)' 'typeof d.pending')"
[ "$pending_type" = "number" ] || fail "summary.json .pending is not a number (got type '$pending_type')" "$body"
echo "  [1/3] GET /ext/orders/summary.json OK"

#############################################
# 2. frontend bundle manifest
#############################################
resp="$(curl -sS -w '\n%{http_code}' "${BASE_URL}/extensions/frontend.json")"
code="$(printf '%s' "$resp" | tail -n1)"
body="$(printf '%s' "$resp" | sed '$d')"
[ "$code" = "200" ] || fail "GET /extensions/frontend.json returned HTTP $code" "$body"

has_orders="$(printf '%s' "$body" | json_get \
  '[.bundles[]?.src | select(endswith("orders.js"))] | length > 0' \
  '(Array.isArray(d.bundles) && d.bundles.some(b => typeof b.src === "string" && b.src.endsWith("orders.js")))')"
[ "$has_orders" = "true" ] || fail "frontend.json .bundles has no entry whose .src ends with 'orders.js'" "$body"
echo "  [2/3] GET /extensions/frontend.json OK"

#############################################
# 3. menu entry (server-side, from mounted config/menu.yml)
#############################################
resp="$(curl -sS -w '\n%{http_code}' "${BASE_URL}/menu.json")"
code="$(printf '%s' "$resp" | tail -n1)"
body="$(printf '%s' "$resp" | sed '$d')"
[ "$code" = "200" ] || fail "GET /menu.json returned HTTP $code" "$body"

has_entry="$(printf '%s' "$body" | json_get \
  '[.entries[]? | select(.route == "/ext/orders" and .text == "Orders")] | length > 0' \
  '(Array.isArray(d.entries) && d.entries.some(e => e.route === "/ext/orders" && e.text === "Orders"))')"
[ "$has_entry" = "true" ] || fail "menu.json .entries has no { route: '/ext/orders', text: 'Orders' }" "$body"
echo "  [3/3] GET /menu.json OK"

echo "OK"
