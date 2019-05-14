FROM node:10-alpine

WORKDIR /app

COPY . .

RUN apk add --no-cache --virtual .build-deps git python g++ bash make && \
    yarn && \
    yarn build && \
    apk del .build-deps
