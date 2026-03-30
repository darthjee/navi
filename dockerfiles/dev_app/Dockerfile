FROM darthjee/node:0.2.1

COPY --chown=node:node ./dev/ /home/node/app/

USER node
WORKDIR /home/node/app

RUN yarn install

CMD ["node", "app.js"]
