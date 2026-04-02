FROM darthjee/production_node:0.2.1 AS builder

COPY --chown=node:node ./source/package.json ./source/yarn.lock /home/node/app/

WORKDIR /home/node/app

RUN yarn install --frozen-lockfile --production

######################################

FROM darthjee/production_node:0.2.1

ENV NODE_ENV=production

COPY --chown=node:node --from=builder /home/node/app/node_modules/ /home/node/app/node_modules/
COPY --chown=node:node ./source/lib/ /home/node/app/lib/
COPY --chown=node:node ./source/bin/ /home/node/app/bin/
COPY --chown=node:node ./source/package.json /home/node/app/

USER node
