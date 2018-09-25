FROM node:8-alpine

WORKDIR /app

RUN apk update && \
    apk add git && \
    npm install -g lerna

COPY ./ /app

RUN lerna bootstrap

ENTRYPOINT "./entrypoint.sh"
