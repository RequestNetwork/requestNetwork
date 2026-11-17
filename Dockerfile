FROM node:22.23.5-alpine3.23
RUN apk add --no-cache git
RUN npm install -g solc

## Warning! This Docker config is meant to be used for development and debugging, not in prod.

WORKDIR /base

COPY package.json .
COPY yarn.lock .
RUN yarn install && \
    yarn cache clean

COPY . .
RUN yarn clean && \
    yarn build && \
    yarn cache clean

# Port configuration
ENV PORT 3000
EXPOSE 3000
