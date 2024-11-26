FROM node:18-alpine
RUN apk add --no-cache git
RUN npm install -g solc

## Warning! This Docker config is meant to be used for development and debugging, not in prod.

WORKDIR /base

COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY . .
RUN yarn clean
RUN yarn build

# Port configuration
ENV PORT 3000
EXPOSE 3000
