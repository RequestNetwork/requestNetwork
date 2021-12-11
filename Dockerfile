FROM node:14-alpine as installer

WORKDIR /app

COPY package.json .
COPY node_modules .
COPY packages/request-node/dist dist .

RUN ["node","dist"]
