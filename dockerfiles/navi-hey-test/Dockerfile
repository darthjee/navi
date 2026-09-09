# darthjee/navi-hey-test — Jasmine test harness for downstream Navi extension code.
#
# A lean-production sibling of dockerfiles/production_navi_hey/: it bakes both
# Navi toolchains (backend + frontend devDependencies), the reused
# frontend/spec/support/* files, the SPEC-6 navi-hey/testing doubles behind an
# image-only navi-hey/package.json "exports" map, and two spec_dir-scoped
# Jasmine configs run as two separate node processes (so helpers / jsdom
# globals / coverage never cross between the backend and frontend suites).
#
# Build context = repo root. amd64 only.
#   docker build -f dockerfiles/navi-hey-test/Dockerfile -t darthjee/navi-hey-test:latest .
#
# Author usage — mount the project's src/ and tests/ read-only and run a suite:
#   docker run --rm \
#     -v "$PWD/src:/work/src:ro" -v "$PWD/tests:/work/tests:ro" \
#     darthjee/navi-hey-test:latest            # all | backend | frontend | lint | sh

FROM darthjee/scripts:0.7.0 AS scripts

# --------------------------------------------------------------------------
FROM darthjee/node:0.2.1 AS base
ENV HOME_DIR=/home/node

# --------------------------------------------------------------------------
# Backend toolchain: source/ devDependencies (jasmine, c8, eslint, ...).
FROM base AS backend_builder
ENV HOME_DIR=/home/node
COPY --chown=node:node ./worker/ /home/node/worker/
COPY --chown=node:node ./source/package.json ./source/yarn.lock /home/node/app/
COPY --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash /usr/local/sbin/yarn_builder.sh \
 && if [ -L /home/node/app/node_modules/deku-swarm ]; then \
      target="$(readlink -f /home/node/app/node_modules/deku-swarm)"; \
      rm /home/node/app/node_modules/deku-swarm; \
      cp -R "$target" /home/node/app/node_modules/deku-swarm; \
    fi

# --------------------------------------------------------------------------
# Frontend toolchain: frontend/ devDependencies (jasmine, jsdom, esbuild, ...).
FROM base AS frontend_builder
ENV HOME_DIR=/home/node
COPY --chown=node:node ./frontend/package.json ./frontend/yarn.lock /home/node/app/
COPY --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash /usr/local/sbin/yarn_builder.sh

# --------------------------------------------------------------------------
FROM base AS final
ENV HOME_DIR=/home/node
ENV NODE_ENV=test

USER root

# Navi toolchains (full devDependencies), plus the warmed yarn cache so an
# ad-hoc `yarn add` inside `sh` stays offline-fast.
COPY --from=backend_builder  /home/node/app/node_modules  /navi/source/node_modules
COPY --from=frontend_builder /home/node/app/node_modules  /navi/frontend/node_modules
COPY --from=backend_builder  /home/node/yarn/new/  /usr/local/share/.cache/yarn/v6/
COPY --from=frontend_builder /home/node/yarn/new/  /usr/local/share/.cache/yarn/v6/

# Baked navi-hey package: the *real* RequestHandler (byte-identical to the
# runtime image's navi-hey/extension — "what you test is what runs") plus the
# promoted backend doubles and the reused frontend support files, all verbatim.
COPY ./source/lib/ /navi/node_modules/navi-hey/lib/
COPY ./source/spec/support/utils/AxiosUtils.js  /navi/node_modules/navi-hey/spec/support/utils/AxiosUtils.js
COPY ./source/spec/support/utils/LoggerUtils.js /navi/node_modules/navi-hey/spec/support/utils/LoggerUtils.js
COPY ./frontend/spec/support/dom.js   /navi/node_modules/navi-hey/frontend-support/dom.js
COPY ./frontend/spec/support/fetch.js /navi/node_modules/navi-hey/frontend-support/fetch.js
COPY ./dockerfiles/navi-hey-test/navi-hey.package.json /navi/node_modules/navi-hey/package.json

# Baked runner configs + the reused frontend loader hooks (verbatim).
COPY ./dockerfiles/navi-hey-test/jasmine.backend.json  /opt/navi-hey-test/jasmine.backend.json
COPY ./dockerfiles/navi-hey-test/jasmine.frontend.json /opt/navi-hey-test/jasmine.frontend.json
COPY ./dockerfiles/navi-hey-test/c8.json               /opt/navi-hey-test/c8.json
COPY ./dockerfiles/navi-hey-test/eslint.config.mjs     /opt/navi-hey-test/eslint.config.mjs
COPY ./dockerfiles/navi-hey-test/opt.package.json      /opt/navi-hey-test/package.json
COPY ./frontend/spec/support/loader.js          /opt/navi-hey-test/loader.js
COPY ./frontend/spec/support/transform_hooks.js /opt/navi-hey-test/transform_hooks.js
COPY ./dockerfiles/navi-hey-test/link_farm.sh   /usr/local/sbin/link_farm.sh
COPY ./dockerfiles/navi-hey-test/entrypoint.sh  /usr/local/bin/navi-hey-test

# Wire module resolution with symlink farms (no copies):
#  - /opt/navi-hey-test/node_modules -> frontend install (esbuild for the loader)
#  - navi-hey package node_modules   <- backend then frontend installs (axios for
#    AxiosUtils, lib/ deps for LoggerUtils, react/react-dom/jsdom for dom.js)
#  - /work/node_modules              <- backend then frontend installs + navi-hey,
#    so the author's mounted src/ + tests/ resolve everything the image ships
RUN chmod +x /usr/local/bin/navi-hey-test /usr/local/sbin/link_farm.sh \
 && ln -s /navi/frontend/node_modules /opt/navi-hey-test/node_modules \
 && /bin/bash /usr/local/sbin/link_farm.sh /navi/node_modules/navi-hey/node_modules \
      /navi/source/node_modules /navi/frontend/node_modules \
 && /bin/bash /usr/local/sbin/link_farm.sh /work/node_modules \
      /navi/source/node_modules /navi/frontend/node_modules \
 && ln -sfn /navi/node_modules/navi-hey /work/node_modules/navi-hey \
 && mkdir -p /work/coverage \
 && chown -R node:node /work

WORKDIR /work
USER node

ENTRYPOINT ["/usr/local/bin/navi-hey-test"]
CMD ["all"]
