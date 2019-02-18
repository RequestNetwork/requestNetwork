FROM node:latest as builder
WORKDIR /
ADD package.json .
RUN npm install

# ADD src src
# ADD tsconfig.json tsconfig.json
# RUN npm install typescript
# RUN npm run build


FROM alpine:latest as main

RUN apk add --update nodejs

WORKDIR /request-node
COPY --from=builder /node_modules node_modules
ADD package.json .
# WORKDIR /dist
ADD dist dist

# Port configuration
ENV PORT 3000
EXPOSE 3000

# Run
CMD ["node", "dist/server.js"]
