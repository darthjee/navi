FROM darthjee/production_node:0.2.1

COPY --chown=node:node ./source/package.json ./source/yarn.lock /home/node/app/

RUN cd /home/node/app && yarn install --production --frozen-lockfile

COPY --chown=node:node ./source/lib/ /home/node/app/lib/

USER node
