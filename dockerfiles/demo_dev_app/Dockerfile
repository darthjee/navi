FROM darthjee/node:0.2.1 as frontend

COPY --chown=node:node dev/frontend/ /home/node/app/

RUN yarn install && yarn build

######################################

FROM darthjee/node:0.2.1

COPY --chown=node:node dev/app/ /home/node/app/

RUN yarn install --production

COPY --chown=node:node --from=frontend /home/node/app/dist /home/node/app/static

USER node

CMD ["node", "server.js"]
