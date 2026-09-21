FROM darthjee/scripts:0.6.0 as scripts
FROM darthjee/node:0.2.1 as base

USER root
RUN apt-get update && apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6 && rm -rf /var/lib/apt/lists/*
USER node

# navi-spec-support is a `file:../../spec-support` dependency of dev/frontend/,
# so the folder must exist two levels above app/ for `yarn install` to resolve it.
COPY --chown=node:node ./spec-support/ /home/spec-support/
COPY --chown=node:node \
  ./dev/frontend/package.json ./dev/frontend/yarn.lock \
  /home/node/app/

######################################

FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=node:node --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh
USER node

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/node

COPY --chown=node:node --from=builder /home/node/yarn/new/ /usr/local/share/.cache/yarn/v6/

USER node
