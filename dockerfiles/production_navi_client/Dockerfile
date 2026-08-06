FROM darthjee/production_node:0.2.1

ARG CLIENT_VERSION=latest

ENV NODE_ENV=production

RUN npm install -g navi-hey-client@${CLIENT_VERSION}

USER node

CMD navi-client
