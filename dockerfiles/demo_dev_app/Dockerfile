FROM darthjee/node:0.2.1

COPY --chown=node:node dev/app/ /home/node/app/

RUN cd /home/node/app && yarn install --production

CMD ["node", "server.js"]
