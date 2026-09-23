FROM darthjee/node:0.2.1 as frontend

COPY --chown=node:node dev/frontend/ /home/node/app/

RUN yarn install && yarn build

######################################

FROM darthjee/node:0.2.1 as builder

COPY --chown=node:node dev/app/ /home/node/app/
COPY --chown=node:node source/lib/common/ /home/node/app/lib/common/
COPY --chown=node:node ./logger/ /home/node/logger/

RUN rm -rf spec eslint.config.mjs

RUN yarn install --production \
 && if [ -L /home/node/app/node_modules/deku-sprout ]; then \
      target="$(readlink -f /home/node/app/node_modules/deku-sprout)"; \
      rm /home/node/app/node_modules/deku-sprout; \
      cp -R "$target" /home/node/app/node_modules/deku-sprout; \
    fi

######################################

FROM darthjee/node:0.2.1

COPY --chown=node:node --from=builder /home/node/app/ /home/node/app/

COPY --chown=node:node --from=frontend /home/node/app/dist /home/node/app/static

USER node

CMD ["node", "server.js"]
