FROM darthjee/production_node:0.2.1

ARG NAVI_VERSION=latest

ENV NODE_ENV=production

ENV NAVI_CONFIG=./config/web.yml
ENV NAVI_MENU=./config/menu.yml
ENV PORT=3000
ENV LOGS_PAGE_SIZE=20
ENV ENABLE_SHUTDOWN=false
ENV AUTOSTART=true
ENV IDLE_TIMEOUT=0
ENV API_TOKEN=
ENV WORKERS=1
ENV RETRY_COOLDOWN=2000
ENV WORKERS_SLEEP=500
ENV MAX_RETRIES=3
ENV NAVI_EXTENSIONS_DIR=/navi/extensions

RUN npm install -g navi-hey@${NAVI_VERSION}

RUN mkdir -p /navi/node_modules \
 && ln -s "$(npm root -g)/navi-hey" /navi/node_modules/navi-hey

COPY dockerfiles/production_navi_hey/config/web.yml /home/node/app/config/web.yml
COPY dockerfiles/production_navi_hey/config/menu.yml /home/node/app/config/menu.yml

USER node

CMD navi-hey -c $NAVI_CONFIG -m $NAVI_MENU
