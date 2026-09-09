# Worked example: a derived image with the orders extension baked in.
# Build context = repo root; run `npm --prefix examples/navi-orders-extension ci`
# and `... run build` first so examples/navi-orders-extension/dist/ exists.
ARG NAVI_TAG=latest
FROM darthjee/navi-hey:${NAVI_TAG}

COPY examples/navi-orders-extension/dist/ /navi/extensions/
COPY examples/navi-orders-extension/config/menu.yml /home/node/app/config/menu.yml

ENV NAVI_EXTENSIONS_ENABLED=true
